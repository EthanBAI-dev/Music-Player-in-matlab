/**
 * FFT Spectrum Analyzer & Equalizer
 * Core application logic: FFT algorithm, signal generation, visualization, audio processing
 *
 * Dependencies: math.js, Chart.js
 */

'use strict';

// ============================================================
//  FFT CORE ENGINE
// ============================================================

class FFTCore {
    /**
     * Compute FFT using Cooley-Tukey radix-2 algorithm via math.js
     * @param {number[]} signal - Real-valued input signal
     * @returns {{ real: Float64Array, imag: Float64Array, magnitude: Float64Array, phase: Float64Array }}
     */
    static fft(signal) {
        const N = signal.length;
        if (N & (N - 1)) throw new Error('FFT size must be power of 2');

        // Convert to math.js complex array
        const complex = signal.map(x => math.complex(x, 0));

        // Perform FFT
        const result = math.fft(complex);

        // Extract components
        const real = new Float64Array(N);
        const imag = new Float64Array(N);
        const magnitude = new Float64Array(N);
        const phase = new Float64Array(N);

        for (let i = 0; i < N; i++) {
            const c = result[i];
            real[i] = math.re(c);
            imag[i] = math.im(c);
            magnitude[i] = math.abs(c);
            phase[i] = math.atan2(math.im(c), math.re(c));
        }

        return { real, imag, magnitude, phase };
    }

    /**
     * Compute IFFT to recover time-domain signal
     * @param {{ real: number[], imag: number[] }} freqData - Frequency domain data
     * @returns {Float64Array} Reconstructed time-domain signal
     */
    static ifft(freqData) {
        const N = freqData.real.length;
        const complex = [];
        for (let i = 0; i < N; i++) {
            complex.push(math.complex(freqData.real[i], freqData.imag[i]));
        }
        const result = math.ifft(complex);
        const signal = new Float64Array(N);
        for (let i = 0; i < N; i++) {
            signal[i] = math.re(result[i]);
        }
        return signal;
    }

    /**
     * Compute single-sided magnitude spectrum from FFT result
     * @param {Float64Array} magnitude - Full FFT magnitude array
     * @param {number} fs - Sampling frequency
     * @returns {{ magnitude: Float64Array, frequency: Float64Array }}
     */
    static singleSidedSpectrum(magnitude, fs) {
        const N = magnitude.length;
        const halfN = Math.floor(N / 2);
        const mag = new Float64Array(halfN);
        const freq = new Float64Array(halfN);

        for (let i = 0; i < halfN; i++) {
            mag[i] = (i === 0) ? magnitude[0] / N : magnitude[i] * 2 / N;
            freq[i] = i * fs / N;
        }

        return { magnitude: mag, frequency: freq };
    }
}

// ============================================================
//  SIGNAL GENERATOR
// ============================================================

class SignalGenerator {
    /**
     * Generate a sine wave
     */
    static sine(t, freq, amp, phase) {
        return amp * Math.sin(2 * Math.PI * freq * t + phase);
    }

    /**
     * Generate a square wave
     */
    static square(t, freq, amp, phase) {
        return amp * Math.sign(Math.sin(2 * Math.PI * freq * t + phase));
    }

    /**
     * Generate a triangle wave
     */
    static triangle(t, freq, amp, phase) {
        const p = (freq * t + phase / (2 * Math.PI)) % 1;
        return amp * (4 * Math.abs(p - 0.5) - 1);
    }

    /**
     * Generate a sawtooth wave
     */
    static sawtooth(t, freq, amp, phase) {
        const p = (freq * t + phase / (2 * Math.PI)) % 1;
        return amp * (2 * p - 1);
    }

    /**
     * Generate signal based on type
     * @param {string} type - Waveform type: sine, square, triangle, sawtooth
     * @param {number} freq - Frequency in Hz
     * @param {number} amp - Amplitude
     * @param {number} phaseDeg - Phase in degrees
     * @param {number} fs - Sample rate in Hz
     * @param {number} duration - Duration in seconds
     * @returns {Float64Array}
     */
    static generate(type, freq, amp, phaseDeg, fs, duration) {
        const N = Math.floor(fs * duration);
        const signal = new Float64Array(N);
        const phaseRad = (phaseDeg || 0) * Math.PI / 180;

        const generators = {
            sine: SignalGenerator.sine,
            square: SignalGenerator.square,
            triangle: SignalGenerator.triangle,
            sawtooth: SignalGenerator.sawtooth
        };

        const gen = generators[type] || generators.sine;

        for (let i = 0; i < N; i++) {
            const t = i / fs;
            signal[i] = gen(t, freq, amp, phaseRad);
        }

        return signal;
    }
}

// ============================================================
//  EQUALIZER PROCESSOR
// ============================================================

class Equalizer {
    static BANDS = [
        { name: '31',  low: 0,     high: 31    },
        { name: '62',  low: 31,    high: 62    },
        { name: '125', low: 62,    high: 125   },
        { name: '250', low: 125,   high: 250   },
        { name: '500', low: 250,   high: 500   },
        { name: '1k',  low: 500,   high: 1000  },
        { name: '2k',  low: 1000,  high: 2000  },
        { name: '4k',  low: 2000,  high: 4000  },
        { name: '8k',  low: 4000,  high: 8000  },
        { name: '16k', low: 8000,  high: 16000 }
    ];

    /**
     * Apply equalization to audio data
     * @param {Float64Array} signal - Input audio signal
     * @param {number} fs - Sample rate
     * @param {number[]} gains - Array of 10 gain values in dB
     * @returns {Float64Array} Equalized signal
     */
    static process(signal, fs, gains) {
        const N = signal.length;
        if (N & (N - 1)) {
            // Pad to next power of 2
            const nextPow2 = 1 << Math.ceil(Math.log2(N));
            const padded = new Float64Array(nextPow2);
            padded.set(signal);
            signal = padded;
        }

        // FFT
        const fftResult = FFTCore.fft(signal);
        const N_fft = fftResult.real.length;

        // Apply gains in frequency domain
        const real = [...fftResult.real];
        const imag = [...fftResult.imag];

        for (let i = 0; i < N_fft; i++) {
            const freqHz = (i <= N_fft / 2)
                ? i * fs / N_fft
                : (N_fft - i) * fs / N_fft;

            let gainFactor = 1;
            for (let b = 0; b < Equalizer.BANDS.length; b++) {
                const band = Equalizer.BANDS[b];
                if (freqHz >= band.low && freqHz < band.high) {
                    gainFactor = Math.exp(gains[b] / 20);
                    break;
                }
            }

            real[i] *= gainFactor;
            imag[i] *= gainFactor;
        }

        // IFFT
        const output = FFTCore.ifft({ real, imag });
        return output.slice(0, N);
    }
}

// ============================================================
//  MAIN APPLICATION
// ============================================================

class App {
    constructor() {
        // State
        this.currentSignal = null;
        this.currentFs = 2048;
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        this.equalizedData = null;
        this.loadedFileName = '';

        // DOM refs
        this.refs = {};

        // Charts
        this.timeChart = null;
        this.freqChart = null;
        this.eqChart = null;

        this.init();
    }

    init() {
        this.cacheDOM();
        this.setupSliders();
        this.setupEventListeners();
        this.initCharts();
        this.generateAndUpdate();
        this.setupEqualizer();

        console.log('[App] Initialized successfully');
    }

    cacheDOM() {
        const ids = [
            'signalType', 'frequency', 'frequencyVal',
            'amplitude', 'amplitudeVal', 'phase', 'phaseVal',
            'sampleRate', 'fftSize',
            'applyBtn', 'resetBtn',
            'timeDomainChart', 'freqDomainChart',
            'statsInfo', 'peakFreq',
            'eq0', 'eq1', 'eq2', 'eq3', 'eq4',
            'eq5', 'eq6', 'eq7', 'eq8', 'eq9',
            'eqVal0', 'eqVal1', 'eqVal2', 'eqVal3', 'eqVal4',
            'eqVal5', 'eqVal6', 'eqVal7', 'eqVal8', 'eqVal9',
            'flatBtn', 'eqPlayBtn', 'eqStopBtn',
            'eqSpectrumChart',
            'audioFile', 'fileName', 'playOrigBtn', 'playEqBtn',
            'stopBtn', 'saveBtn', 'statusDisplay',
            'helpBtn', 'helpModal', 'helpClose', 'helpCloseBtn'
        ];

        ids.forEach(id => {
            this.refs[id] = document.getElementById(id);
        });

        // Nav links
        this.refs.navLinks = document.querySelectorAll('.nav-link');
    }

    setupSliders() {
        // Linked slider + number input pairs
        const pairs = [
            { slider: 'frequency', number: 'frequencyVal' },
            { slider: 'amplitude', number: 'amplitudeVal' },
            { slider: 'phase', number: 'phaseVal' }
        ];

        for (const pair of pairs) {
            const slider = this.refs[pair.slider];
            const number = this.refs[pair.number];

            slider.addEventListener('input', () => {
                number.value = slider.value;
            });

            number.addEventListener('input', () => {
                slider.value = number.value;
            });
        }
    }

    setupEventListeners() {
        // Apply / Reset
        this.refs.applyBtn.addEventListener('click', () => this.generateAndUpdate());
        this.refs.resetBtn.addEventListener('click', () => this.resetDefaults());

        // Enter key on number inputs
        ['frequencyVal', 'amplitudeVal', 'phaseVal'].forEach(id => {
            this.refs[id].addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.generateAndUpdate();
            });
        });

        // Audio file
        this.refs.audioFile.addEventListener('change', (e) => this.handleFileUpload(e));

        // Playback
        this.refs.playOrigBtn.addEventListener('click', () => this.playOriginal());
        this.refs.playEqBtn.addEventListener('click', () => this.playEqualized());
        this.refs.stopBtn.addEventListener('click', () => this.stopPlayback());

        // Save
        this.refs.saveBtn.addEventListener('click', () => this.saveWav());

        // Equalizer
        this.refs.flatBtn.addEventListener('click', () => this.flatEqualizer());

        // Modal
        this.refs.helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.refs.helpModal.classList.add('open');
        });
        this.refs.helpClose.addEventListener('click', () => this.refs.helpModal.classList.remove('open'));
        this.refs.helpCloseBtn.addEventListener('click', () => this.refs.helpModal.classList.remove('open'));
        this.refs.helpModal.addEventListener('click', (e) => {
            if (e.target === this.refs.helpModal) this.refs.helpModal.classList.remove('open');
        });

        // Nav smooth scroll
        this.refs.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href')?.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(link.getAttribute('href'));
                    if (target) {
                        const headerH = document.querySelector('.app-header').offsetHeight;
                        const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerH - 16;
                        window.scrollTo({ top: targetPos, behavior: 'smooth' });
                    }
                }
            });
        });
    }

    resetDefaults() {
        this.refs.frequency.value = '100';
        this.refs.frequencyVal.value = '100';
        this.refs.amplitude.value = '1';
        this.refs.amplitudeVal.value = '1';
        this.refs.phase.value = '0';
        this.refs.phaseVal.value = '0';
        this.refs.signalType.value = 'sine';
        this.refs.sampleRate.value = '2048';
        this.refs.fftSize.value = '2048';
        this.generateAndUpdate();
    }

    // ============================================================
    //  CHART INITIALIZATION
    // ============================================================

    initCharts() {
        const chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: '#2d3a50',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 10, family: 'monospace' }, maxTicksLimit: 10 }
                },
                y: {
                    grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 10, family: 'monospace' } },
                    beginAtZero: true
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };

        // Time Domain Chart
        const timeCtx = this.refs.timeDomainChart.getContext('2d');
        this.timeChart = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Amplitude',
                    data: [],
                    borderColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--color-chart-time').trim() || '#818cf8',
                    backgroundColor: (ctx) => {
                        const grad = timeCtx.createLinearGradient(0, 0, 0, 260);
                        grad.addColorStop(0, 'rgba(129, 140, 248, 0.15)');
                        grad.addColorStop(1, 'rgba(129, 140, 248, 0)');
                        return grad;
                    },
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    ...chartDefaults.scales,
                    x: {
                        ...chartDefaults.scales.x,
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: '#64748b',
                            font: { size: 10 }
                        }
                    },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Amplitude',
                            color: '#64748b',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });

        // Frequency Domain Chart
        const freqCtx = this.refs.freqDomainChart.getContext('2d');
        this.freqChart = new Chart(freqCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Magnitude',
                    data: [],
                    backgroundColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--color-chart-freq').trim() || '#22d3ee',
                    borderWidth: 0,
                    borderRadius: 1
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    ...chartDefaults.scales,
                    x: {
                        ...chartDefaults.scales.x,
                        title: {
                            display: true,
                            text: 'Frequency (Hz)',
                            color: '#64748b',
                            font: { size: 10 }
                        }
                    },
                    y: {
                        ...chartDefaults.scales.y,
                        title: {
                            display: true,
                            text: 'Magnitude',
                            color: '#64748b',
                            font: { size: 10 }
                        },
                        ticks: {
                            ...chartDefaults.scales.y.ticks,
                            callback: (v) => v.toFixed(1)
                        }
                    }
                }
            }
        });

        // Equalizer spectrum chart
        const eqCtx = this.refs.eqSpectrumChart.getContext('2d');
        this.eqChart = new Chart(eqCtx, {
            type: 'bar',
            data: {
                labels: ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'],
                datasets: [{
                    label: 'Gain (dB)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#6366f1', '#6366f1', '#6366f1', '#6366f1', '#6366f1',
                        '#22d3ee', '#22d3ee', '#22d3ee', '#22d3ee', '#22d3ee'
                    ],
                    borderRadius: 3,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 200 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.parsed.y.toFixed(1)} dB`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 10, family: 'monospace' } }
                    },
                    y: {
                        grid: { color: 'rgba(148, 163, 184, 0.06)' },
                        ticks: { color: '#64748b', font: { size: 10 } },
                        min: -35,
                        max: 35
                    }
                }
            }
        });
    }

    // ============================================================
    //  SIGNAL GENERATION & UPDATE
    // ============================================================

    generateAndUpdate() {
        const type = this.refs.signalType.value;
        const freq = parseFloat(this.refs.frequency.value);
        const amp = parseFloat(this.refs.amplitude.value);
        const phase = parseFloat(this.refs.phase.value);
        const fs = parseInt(this.refs.sampleRate.value);
        const fftSize = parseInt(this.refs.fftSize.value);

        this.currentFs = fs;

        // Generate signal
        const duration = fftSize / fs;
        const signal = SignalGenerator.generate(type, freq, amp, phase, fs, duration);
        this.currentSignal = signal;

        // Update stats
        this.refs.statsInfo.textContent = `N: ${fftSize} | Fs: ${fs} Hz`;

        // Update time domain chart
        this.updateTimeChart(signal, fs);

        // Compute and update frequency domain
        const fftResult = FFTCore.fft(signal.slice(0, fftSize));
        const spectrum = FFTCore.singleSidedSpectrum(fftResult.magnitude, fs);

        this.updateFreqChart(spectrum);

        // Find peak frequency
        let maxIdx = 0;
        for (let i = 1; i < spectrum.magnitude.length; i++) {
            if (spectrum.magnitude[i] > spectrum.magnitude[maxIdx]) {
                maxIdx = i;
            }
        }
        const peakFreq = spectrum.frequency[maxIdx];
        this.refs.peakFreq.textContent = `Peak: ${peakFreq.toFixed(1)} Hz`;

        // Update status
        this.setStatus('Signal updated', 'ready');
    }

    updateTimeChart(signal, fs) {
        // Show first ~512 points max for performance
        const maxPoints = Math.min(signal.length, 512);
        const step = Math.max(1, Math.floor(signal.length / maxPoints));

        const labels = [];
        const data = [];

        for (let i = 0; i < signal.length; i += step) {
            labels.push((i / fs).toFixed(4));
            data.push(signal[i]);
        }

        this.timeChart.data.labels = labels;
        this.timeChart.data.datasets[0].data = data;
        this.timeChart.update('none');
    }

    updateFreqChart(spectrum) {
        // Limit displayed bins for performance
        const maxBins = Math.min(spectrum.frequency.length, 512);
        const labels = [];
        const data = [];

        for (let i = 0; i < maxBins; i++) {
            labels.push(spectrum.frequency[i].toFixed(1));
            data.push(spectrum.magnitude[i]);
        }

        this.freqChart.data.labels = labels;
        this.freqChart.data.datasets[0].data = data;
        this.freqChart.update('none');
    }

    // ============================================================
    //  EQUALIZER
    // ============================================================

    setupEqualizer() {
        for (let i = 0; i < 10; i++) {
            const slider = this.refs[`eq${i}`];
            const valDisplay = this.refs[`eqVal${i}`];

            slider.addEventListener('input', () => {
                const val = parseFloat(slider.value);
                valDisplay.textContent = `${val > 0 ? '+' : ''}${val} dB`;
                this.updateEqChart();
            });
        }
    }

    getEqGains() {
        const gains = [];
        for (let i = 0; i < 10; i++) {
            gains.push(parseFloat(this.refs[`eq${i}`].value));
        }
        return gains;
    }

    updateEqChart() {
        const gains = this.getEqGains();
        this.eqChart.data.datasets[0].data = gains;

        // Color bars by gain value
        const colors = gains.map(g => {
            const absG = Math.abs(g) / 30;
            if (g > 0) {
                return `rgba(34, 197, 94, ${0.4 + absG * 0.6})`;
            } else if (g < 0) {
                return `rgba(239, 68, 68, ${0.4 + absG * 0.6})`;
            }
            return '#6366f1';
        });
        this.eqChart.data.datasets[0].backgroundColor = colors;
        this.eqChart.update('none');
    }

    flatEqualizer() {
        for (let i = 0; i < 10; i++) {
            this.refs[`eq${i}`].value = '0';
            this.refs[`eqVal${i}`].textContent = '0 dB';
        }
        this.updateEqChart();
        this.setStatus('Equalizer reset to flat', 'ready');
    }

    // ============================================================
    //  AUDIO FILE HANDLING
    // ============================================================

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.loadedFileName = file.name;
        this.refs.fileName.textContent = file.name;
        this.setStatus(`Loading ${file.name}...`, 'loading');

        try {
            const arrayBuffer = await file.arrayBuffer();

            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.currentFs = this.audioBuffer.sampleRate;
            this.setStatus(`Loaded: ${file.name} (${this.audioBuffer.duration.toFixed(1)}s, ${this.currentFs} Hz)`, 'ready');

            // Update analyzer with loaded audio
            const channelData = this.audioBuffer.getChannelData(0);
            const fftSize = parseInt(this.refs.fftSize.value);
            const signal = new Float64Array(Math.min(channelData.length, fftSize));
            for (let i = 0; i < signal.length; i++) {
                signal[i] = channelData[i];
            }
            this.currentSignal = signal;

            this.updateTimeChart(signal, this.currentFs);

            const fftResult = FFTCore.fft(signal);
            const spectrum = FFTCore.singleSidedSpectrum(fftResult.magnitude, this.currentFs);
            this.updateFreqChart(spectrum);

            this.refs.statsInfo.textContent = `N: ${signal.length} | Fs: ${this.currentFs} Hz`;

            // Find peak
            let maxIdx = 0;
            for (let i = 1; i < spectrum.magnitude.length; i++) {
                if (spectrum.magnitude[i] > spectrum.magnitude[maxIdx]) maxIdx = i;
            }
            this.refs.peakFreq.textContent = `Peak: ${spectrum.frequency[maxIdx].toFixed(1)} Hz`;

        } catch (err) {
            console.error('File load error:', err);
            this.setStatus('Error loading file', 'error');
        }
    }

    // ============================================================
    //  AUDIO PLAYBACK
    // ============================================================

    getOrCreateContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    playOriginal() {
        if (!this.audioBuffer) {
            this.setStatus('Please load an audio file first', 'error');
            return;
        }
        this.stopPlayback();
        const ctx = this.getOrCreateContext();
        this.audioSource = ctx.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.connect(ctx.destination);
        this.audioSource.start(0);
        this.isPlaying = true;
        this.setStatus('Playing original audio...', 'ready');
    }

    playEqualized() {
        if (!this.audioBuffer) {
            this.setStatus('Please load an audio file first', 'error');
            return;
        }

        this.setStatus('Applying equalization...', 'loading');

        // Process with equalizer
        const channelData = this.audioBuffer.getChannelData(0);
        const signal = new Float64Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
            signal[i] = channelData[i];
        }

        const gains = this.getEqGains();
        const processed = Equalizer.process(signal, this.currentFs, gains);
        this.equalizedData = processed;

        // Play through Web Audio API
        this.stopPlayback();
        const ctx = this.getOrCreateContext();
        const buffer = ctx.createBuffer(1, processed.length, this.currentFs);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < processed.length; i++) {
            channel[i] = Math.max(-1, Math.min(1, processed[i])); // clamp
        }

        this.audioSource = ctx.createBufferSource();
        this.audioSource.buffer = buffer;
        this.audioSource.connect(ctx.destination);
        this.audioSource.start(0);
        this.isPlaying = true;
        this.setStatus('Playing equalized audio...', 'ready');
    }

    stopPlayback() {
        if (this.audioSource) {
            try { this.audioSource.stop(); } catch (_) { /* ignore */ }
            this.audioSource = null;
        }
        this.isPlaying = false;
        this.setStatus('Stopped', 'ready');
    }

    // ============================================================
    //  SAVE WAV
    // ============================================================

    saveWav() {
        if (!this.equalizedData) {
            this.setStatus('No equalized data to save. Play equalized audio first.', 'error');
            return;
        }

        this.setStatus('Saving...', 'loading');

        try {
            const numChannels = 1;
            const sampleRate = this.currentFs;
            const bitsPerSample = 16;
            const data = this.equalizedData;
            const dataLength = data.length * (bitsPerSample / 8);
            const headerLength = 44;
            const totalLength = headerLength + dataLength;

            const buffer = new ArrayBuffer(totalLength);
            const view = new DataView(buffer);

            // WAV header
            this.writeString(view, 0, 'RIFF');
            view.setUint32(4, totalLength - 8, true);
            this.writeString(view, 8, 'WAVE');
            this.writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true); // PCM
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
            view.setUint16(32, numChannels * (bitsPerSample / 8), true);
            view.setUint16(34, bitsPerSample, true);
            this.writeString(view, 36, 'data');
            view.setUint32(40, dataLength, true);

            // Write samples
            let offset = 44;
            for (let i = 0; i < data.length; i++) {
                const sample = Math.max(-1, Math.min(1, data[i]));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }

            // Download
            const blob = new Blob([buffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const baseName = this.loadedFileName ? this.loadedFileName.replace(/\.[^.]+$/, '') : 'equalized';
            a.download = `${baseName}_equalized.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.setStatus('File saved successfully', 'ready');
        } catch (err) {
            console.error('Save error:', err);
            this.setStatus('Error saving file', 'error');
        }
    }

    writeString(view, offset, str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    // ============================================================
    //  UTILITY
    // ============================================================

    setStatus(text, type) {
        const el = this.refs.statusDisplay;
        el.textContent = text;
        el.style.color = type === 'error' ? 'var(--color-danger)' :
                         type === 'loading' ? 'var(--color-warning)' :
                         'var(--color-success)';
    }
}

// ============================================================
//  BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
