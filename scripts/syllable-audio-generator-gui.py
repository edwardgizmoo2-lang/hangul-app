import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import queue
import asyncio
import os
import sys
import time
import json

# ---------------------------------------------------------------------------
# Hangul syllable data (mirrors src/data/hangul.js)
# ---------------------------------------------------------------------------
BASE = 0xAC00

INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
MEDIALS  = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']
FINALS   = ['ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']

INITIAL_INDEX = {c: i for i, c in enumerate(INITIALS)}
MEDIAL_INDEX  = {'ㅏ':0,'ㅑ':2,'ㅓ':4,'ㅕ':6,'ㅗ':8,'ㅛ':12,'ㅜ':13,'ㅠ':16,'ㅡ':18,'ㅣ':20}
FINAL_INDEX   = {c: i+1 for i, c in enumerate(FINALS)}  # 1-based

def compose(initial, medial, final=None):
    ii = INITIAL_INDEX.get(initial, 0)
    mi = MEDIAL_INDEX.get(medial, 0)
    fi = FINAL_INDEX.get(final, 0) if final else 0
    return chr(BASE + ii * 21 * 28 + mi * 28 + fi)

def build_syllable_list(include_batchim=True):
    items = []
    for c in INITIALS:
        for v in MEDIALS:
            syl2 = compose(c, v)
            items.append((syl2, c, v, None))
            if include_batchim:
                for f in FINALS:
                    syl3 = compose(c, v, f)
                    items.append((syl3, c, v, f))
    return items

# ---------------------------------------------------------------------------
# Generator thread
# ---------------------------------------------------------------------------
class GeneratorThread(threading.Thread):
    def __init__(self, output_dir, progress_q, voice, rate, skip_existing, include_batchim):
        super().__init__(daemon=True)
        self.output_dir = output_dir
        self.progress_q = progress_q
        self.voice = voice
        self.rate = rate
        self.skip_existing = skip_existing
        self.include_batchim = include_batchim
        self.cancelled = False

    def cancel(self):
        self.cancelled = True

    def run(self):
        try:
            asyncio.run(self._run_async())
        except Exception as e:
            self.progress_q.put(('error', str(e)))

    async def _run_async(self):
        import edge_tts
        syllables = build_syllable_list(self.include_batchim)
        total = len(syllables)

        self.progress_q.put(('total', total))
        os.makedirs(self.output_dir, exist_ok=True)

        start_time = time.time()
        errors = 0
        skipped = 0

        for idx, (syl, c, v, f) in enumerate(syllables):
            if self.cancelled:
                self.progress_q.put(('cancelled', None))
                return

            filename = f'{syl}.ogg'
            filepath = os.path.join(self.output_dir, filename)

            f_label = f'받침{f}' if f else ''
            label = f'{syl} ({c}+{v}{f_label})'

            duration = time.time() - start_time
            speed = (idx + 1) / duration if duration > 0 else 0
            eta_secs = (total - idx - 1) / speed if speed > 0 else 0

            status = 'generating'
            self.progress_q.put(('progress', {
                'current': idx + 1,
                'total': total,
                'label': label,
                'syllable': syl,
                'status': status,
                'elapsed': int(duration),
                'eta': int(eta_secs),
                'errors': errors,
                'skipped': skipped,
            }))

            if self.skip_existing and os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                skipped += 1
                self.progress_q.put(('progress', {
                    'current': idx + 1, 'total': total, 'label': label,
                    'syllable': syl, 'status': 'skipped', 'elapsed': int(duration),
                    'eta': int(eta_secs), 'errors': errors, 'skipped': skipped,
                }))
                continue

            try:
                rate_str = f'{self.rate}%' if self.rate and self.rate != '0' else None
                kwargs = {'voice': self.voice}
                if rate_str:
                    kwargs['rate'] = rate_str
                await edge_tts.Communicate(syl, **kwargs).save(filepath)
            except Exception as e:
                errors += 1
                self.progress_q.put(('progress', {
                    'current': idx + 1, 'total': total, 'label': label,
                    'syllable': syl, 'status': f'failed: {e}', 'elapsed': int(duration),
                    'eta': int(eta_secs), 'errors': errors, 'skipped': skipped,
                }))
                continue

        if not self.cancelled:
            duration = time.time() - start_time
            self.progress_q.put(('done', {
                'total': total, 'errors': errors, 'skipped': skipped,
                'elapsed': int(duration),
            }))

# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------
class SyllableGeneratorGUI:
    # Dark theme colors
    BG      = '#1a1a1e'
    BG2     = '#27272a'
    FG      = '#e4e4e7'
    ACCENT  = '#a78bfa'
    RED     = '#f87171'
    GREEN   = '#4ade80'
    YELLOW  = '#fbbf24'
    GRAY    = '#71717a'

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("한글Learn - Syllable Audio Generator")
        self.root.geometry('700x580')
        self.root.configure(bg=self.BG)
        self.root.minsize(600, 500)

        # Try to set dark title bar (Windows 10+)
        try:
            from ctypes import windll, c_int, byref
            DWMWA_USE_IMMERSIVE_DARK_MODE = 20
            hwnd = windll.user32.GetParent(self.root.winfo_id())
            windll.dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, byref(c_int(2)), 4)
        except Exception:
            pass

        script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
        default_out = os.path.join(script_dir, '..', 'public', 'audio', 'syllables')
        self.output_dir = tk.StringVar(value=os.path.normpath(default_out))
        self.voice = tk.StringVar(value='ko-KR-SunHiNeural')
        self.skip_existing = tk.BooleanVar(value=True)
        self.include_batchim = tk.BooleanVar(value=True)
        self.retry_failed = tk.BooleanVar(value=False)

        self.gen_thread = None
        self.progress_q = queue.Queue()
        self.running = False
        self.failed_syllables = []

        self._build_ui()
        self._poll_queue()
        self.root.protocol('WM_DELETE_WINDOW', self._on_close)

    def _build_ui(self):
        style = ttk.Style()
        style.theme_use('clam')

        style.configure('TFrame',    background=self.BG)
        style.configure('TLabel',    background=self.BG, foreground=self.FG, font=('Segoe UI', 10))
        style.configure('TButton',   background=self.ACCENT, foreground='#18181b', font=('Segoe UI', 10, 'bold'))
        style.map('TButton',        background=[('active', '#c4b5fd')])
        style.configure('Header.TLabel', background=self.BG, foreground=self.ACCENT, font=('Segoe UI', 14, 'bold'))
        style.configure('Status.TLabel', background=self.BG, foreground=self.FG, font=('Segoe UI', 9))
        style.configure('Sub.TLabel',    background=self.BG, foreground=self.GRAY, font=('Segoe UI', 9))
        style.configure('Accent.TLabel', background=self.BG, foreground=self.ACCENT, font=('Segoe UI', 9))

        # -- Root frame --
        main = ttk.Frame(self.root)
        main.pack(fill='both', expand=True, padx=16, pady=12)

        # Title
        title = ttk.Label(main, text='🎧 Syllable Audio Generator', style='Header.TLabel')
        title.pack(anchor='w', pady=(0, 4))
        subtitle = ttk.Label(main, text='Generate pre-recorded .ogg files for all 5,320 Hangul syllables using edge-tts', style='Sub.TLabel')
        subtitle.pack(anchor='w', pady=(0, 14))

        # -- Config section --
        cfg_frame = tk.Frame(main, bg=self.BG2, bd=1, relief='solid', highlightbackground=self.GRAY, highlightthickness=1)
        cfg_frame.pack(fill='x', pady=(0, 10))

        pad_opts = {'padx': 12, 'pady': 8}

        # Output dir
        row1 = tk.Frame(cfg_frame, bg=self.BG2)
        row1.pack(fill='x', **pad_opts)
        tk.Label(row1, text='Output Directory:', bg=self.BG2, fg=self.FG, font=('Segoe UI', 10)).pack(side='left')
        dir_entry = tk.Entry(row1, textvariable=self.output_dir, bg='#1a1a1e', fg=self.FG,
                             insertbackground=self.FG, bd=1, relief='solid', font=('Segoe UI', 9))
        dir_entry.pack(side='left', fill='x', expand=True, padx=(8, 6))
        btn_browse = tk.Button(row1, text='Browse', bg=self.ACCENT, fg='#18181b',
                               font=('Segoe UI', 9, 'bold'), bd=0, padx=10, cursor='hand2',
                               activebackground='#c4b5fd', command=self._browse_dir)
        btn_browse.pack(side='right')

        # Voice selector
        row2 = tk.Frame(cfg_frame, bg=self.BG2)
        row2.pack(fill='x', **pad_opts)
        tk.Label(row2, text='TTS Voice:', bg=self.BG2, fg=self.FG, font=('Segoe UI', 10)).pack(side='left')
        voice_combo = ttk.Combobox(row2, textvariable=self.voice, values=[
            'ko-KR-SunHiNeural', 'ko-KR-InJoonNeural', 'ko-KR-HyunsuNeural'
        ], state='readonly', width=30)
        voice_combo.pack(side='left', padx=(8, 0))

        # Rate slider
        row_rate = tk.Frame(cfg_frame, bg=self.BG2)
        row_rate.pack(fill='x', **pad_opts)
        tk.Label(row_rate, text='Speech Rate:', bg=self.BG2, fg=self.FG, font=('Segoe UI', 10)).pack(side='left')
        self.rate_var = tk.IntVar(value=-5)
        rate_slider = tk.Scale(row_rate, from_=-20, to_=20, variable=self.rate_var,
                               orient='horizontal', bg=self.BG2, fg=self.FG,
                               troughcolor=self.BG, activebackground=self.ACCENT,
                               highlightthickness=0, bd=0, length=150,
                               font=('Segoe UI', 8))
        rate_slider.pack(side='left', padx=(8, 0))
        self.rate_label = tk.Label(row_rate, text='-5% (slower)', bg=self.BG2, fg=self.GRAY, font=('Segoe UI', 9))
        self.rate_label.pack(side='left', padx=(6, 0))
        def on_rate_change(val):
            self.rate_label.configure(text=f'{val}%' if int(val) >= 0 else f'{val}% (slower)')
        rate_slider.configure(command=on_rate_change)

        # Checkboxes row
        row3 = tk.Frame(cfg_frame, bg=self.BG2)
        row3.pack(fill='x', **pad_opts)
        for var, text in [
            (self.skip_existing, 'Skip existing files (resume)'),
            (self.include_batchim, 'Include batchim (3-letter) syllables'),
        ]:
            cb = tk.Checkbutton(row3, text=text, variable=var, bg=self.BG2, fg=self.FG,
                                selectcolor=self.BG2, activebackground=self.BG2,
                                activeforeground=self.FG, font=('Segoe UI', 9))
            cb.pack(side='left', padx=(0, 20))

        # -- Stats section --
        stats_frame = tk.Frame(main, bg=self.BG2, bd=1, relief='solid', highlightbackground=self.GRAY, highlightthickness=1)
        stats_frame.pack(fill='x', pady=(0, 10))

        self.var_total = tk.StringVar(value='Total: —')
        self.var_current = tk.StringVar(value='Current: —')
        self.var_elapsed = tk.StringVar(value='Elapsed: —')
        self.var_eta = tk.StringVar(value='ETA: —')
        self.var_errors = tk.StringVar(value='Errors: 0')
        self.var_skipped = tk.StringVar(value='Skipped: 0')

        s_pad = {'padx': 10, 'pady': 6}
        s_frame = tk.Frame(stats_frame, bg=self.BG2)
        s_frame.pack(**s_pad)
        for col, var in enumerate([
            self.var_total, self.var_current, self.var_elapsed,
            self.var_eta, self.var_errors, self.var_skipped
        ]):
            lbl = tk.Label(s_frame, textvariable=var, bg=self.BG2, fg=self.FG,
                           font=('Segoe UI', 9, 'bold'))
            lbl.grid(row=0, column=col, padx=(0, 18), sticky='w')

        # -- Progress bar --
        self.progress_var = tk.IntVar()
        pb_style = ttk.Style()
        pb_style.configure('green.Horizontal.TProgressbar', background=self.ACCENT, troughcolor=self.BG, borderwidth=0)
        self.progress_bar = ttk.Progressbar(main, variable=self.progress_var, maximum=100, mode='determinate',
                                            style='green.Horizontal.TProgressbar', length=668)
        self.progress_bar.pack(fill='x', pady=(2, 6))

        # -- Status label --
        self.status_var = tk.StringVar(value='Ready. Click Start to begin.')
        status_lbl = tk.Label(main, textvariable=self.status_var, bg=self.BG, fg=self.GRAY,
                              font=('Segoe UI', 9), wraplength=660, justify='left')
        status_lbl.pack(fill='x', pady=(0, 8))

        # -- Buttons --
        btn_frame = tk.Frame(main, bg=self.BG)
        btn_frame.pack(fill='x', pady=(0, 8))

        self.btn_start = tk.Button(btn_frame, text='▶ Start', bg=self.GREEN, fg='#18181b',
                                   font=('Segoe UI', 11, 'bold'), bd=0, padx=24, pady=6,
                                   cursor='hand2', activebackground='#86efac', command=self._start)
        self.btn_start.pack(side='left', padx=(0, 8))

        self.btn_cancel = tk.Button(btn_frame, text='■ Cancel', bg=self.RED, fg='#18181b',
                                    font=('Segoe UI', 11, 'bold'), bd=0, padx=20, pady=6,
                                    cursor='hand2', activebackground='#fca5a5', state='disabled',
                                    command=self._cancel)
        self.btn_cancel.pack(side='left')

        # -- Log section --
        log_label = tk.Label(main, text='Log', bg=self.BG, fg=self.GRAY, font=('Segoe UI', 9, 'bold'), anchor='w')
        log_label.pack(fill='x')

        log_frame = tk.Frame(main, bg=self.BG2, bd=1, relief='solid', highlightbackground=self.GRAY, highlightthickness=1)
        log_frame.pack(fill='both', expand=True)

        self.log_text = tk.Text(log_frame, bg='#09090b', fg=self.FG, font=('Consolas', 9),
                                bd=0, relief='flat', wrap='word', state='disabled',
                                insertbackground=self.FG, highlightthickness=0)
        self.log_text.pack(side='left', fill='both', expand=True)

        log_scroll = tk.Scrollbar(log_frame, command=self.log_text.yview, bg=self.BG2,
                                  troughcolor=self.BG, activebackground=self.GRAY)
        log_scroll.pack(side='right', fill='y')
        self.log_text.configure(yscrollcommand=log_scroll.set)

        # Configure text tags
        self.log_text.tag_config('info', foreground=self.FG)
        self.log_text.tag_config('skip', foreground=self.YELLOW)
        self.log_text.tag_config('error', foreground=self.RED)
        self.log_text.tag_config('success', foreground=self.GREEN)
        self.log_text.tag_config('done', foreground=self.ACCENT)

    def _log(self, message, tag='info'):
        self.log_text.configure(state='normal')
        self.log_text.insert('end', message + '\n', tag)
        self.log_text.see('end')
        self.log_text.configure(state='disabled')

    def _browse_dir(self):
        d = filedialog.askdirectory(title='Select output directory', initialdir=self.output_dir.get())
        if d:
            self.output_dir.set(d)

    def _set_controls(self, enabled):
        state = 'normal' if enabled else 'disabled'
        self.btn_start.configure(state=state)
        self.btn_cancel.configure(state='disabled' if enabled else 'normal')

    def _start(self):
        if self.running:
            return

        # Validate
        out_dir = self.output_dir.get().strip()
        if not out_dir:
            messagebox.showerror('Error', 'Please select an output directory.')
            return

        # Warn about excluded syllables
        total_syllables = 190 + (5130 if self.include_batchim.get() else 0)
        if not self.skip_existing.get() and total_syllables > 2000:
            ret = messagebox.askyesno(
                'Confirm',
                f'Generate {total_syllables} audio files? This may take a long time.\n'
                f'Consider checking "Skip existing files" to resume a previous run.\n\nContinue?'
            )
            if not ret:
                return

        try:
            import edge_tts
        except ImportError:
            messagebox.showerror('Missing Dependency',
                'edge-tts is not installed.\n\nRun: pip install edge-tts')
            return

        self.running = True
        self.failed_syllables = []
        self._set_controls(False)
        self.status_var.set('Starting...')
        self.progress_var.set(0)
        self.log_text.configure(state='normal')
        self.log_text.delete('1.0', 'end')
        self.log_text.configure(state='disabled')

        self.progress_q = queue.Queue()
        self.gen_thread = GeneratorThread(
            output_dir=out_dir,
            progress_q=self.progress_q,
            voice=self.voice.get(),
            rate=self.rate_var.get(),
            skip_existing=self.skip_existing.get(),
            include_batchim=self.include_batchim.get(),
        )
        self.gen_thread.start()

    def _cancel(self):
        if self.gen_thread and self.running:
            self.gen_thread.cancel()
            self._log('⏹ Cancelling...', 'error')

    def _on_close(self):
        if self.running:
            if not messagebox.askokcancel('Quit', 'Generation is in progress. Quit anyway?'):
                return
            if self.gen_thread:
                self.gen_thread.cancel()
        self.root.destroy()

    def _poll_queue(self):
        try:
            while True:
                msg = self.progress_q.get_nowait()
                self._handle_msg(msg)
        except queue.Empty:
            pass
        self.root.after(100, self._poll_queue)

    def _handle_msg(self, msg):
        typ, data = msg

        if typ == 'total':
            total = data
            self.var_total.set(f'Total: {total}')
            self.progress_bar.configure(maximum=total)

        elif typ == 'progress':
            p = data
            self.progress_var.set(p['current'])
            self.var_current.set(f'Current: {p["current"]}/{p["total"]}')
            self.var_elapsed.set(f'Elapsed: {self._fmt_time(p["elapsed"])}')
            self.var_eta.set(f'ETA: {self._fmt_time(p["eta"])}')
            self.var_errors.set(f'Errors: {p["errors"]}')
            self.var_skipped.set(f'Skipped: {p["skipped"]}')

            status = p['status']
            syl = p['syllable']
            label = p['label']

            if status == 'generating':
                self.status_var.set(f'▶ Generating: {label} ({p["current"]}/{p["total"]})')
                self._log(f'▶ {label}', 'info')
            elif status == 'skipped':
                self.status_var.set(f'⏭ Skipped: {label}')
                self._log(f'⏭ {label}', 'skip')
            elif status.startswith('failed'):
                self.status_var.set(f'✗ Failed: {label}')
                self._log(f'✗ {label}: {status}', 'error')
                self.failed_syllables.append(syl)

        elif typ == 'done':
            self.running = False
            self._set_controls(True)
            d = data
            summary = (f'Done! {d["total"]} processed, '
                       f'{d["skipped"]} skipped, {d["errors"]} errors '
                       f'in {self._fmt_time(d["elapsed"])}')
            self._log('=' * 50, 'done')
            self._log(summary, 'done')
            self.status_var.set(summary)
            # Reset progress bar
            self.progress_var.set(0)
            self.progress_bar.configure(maximum=100)

        elif typ == 'cancelled':
            self.running = False
            self._set_controls(True)
            self._log('⏹ Cancelled by user.', 'error')
            self.status_var.set('Cancelled.')
            self.progress_var.set(0)
            self.progress_bar.configure(maximum=100)

        elif typ == 'error':
            self.running = False
            self._set_controls(True)
            self._log(f'FATAL: {data}', 'error')
            self.status_var.set(f'Error: {data}')

    @staticmethod
    def _fmt_time(secs):
        if secs < 0:
            return '--:--:--'
        h, r = divmod(int(secs), 3600)
        m, s = divmod(r, 60)
        return f'{h:02d}:{m:02d}:{s:02d}'

    def run(self):
        self.root.mainloop()

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    app = SyllableGeneratorGUI()
    app.run()
