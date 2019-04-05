class HarmonyConductor {

  get audioContext() {
    if (!this._audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this._audioContext = new AudioContext()
      this.masterGain = this._audioContext.createGain()
      this.masterGain.gain.setValueAtTime(this.masterVolume, this._audioContext.currentTime)
      this.output = this._audioContext.createChannelMerger(30)
      this.output.connect(this.masterGain)
      this.masterGain.connect(this._audioContext.destination)
    }
    return this._audioContext
  }

  get masterVolume() { return this._masterVolume }
  set masterVolume(n) {
    if (typeof n === 'number' && 0 <= n && n <= 10) {
      this._masterVolume = n
      if (this.masterGain instanceof GainNode) this.masterGain.gain.setValueAtTime(n, this.audioContext.currentTime)
    }
    else throw new Error('InvalidNumber')
  }

  get soundVolume() { return this._soundVolume }
  set soundVolume(n) {
    if (typeof n === 'number' && 0 <= n && n <= 10) {
      this._soundVolume = n
      this.gainNodes.forEach(node => { if (node instanceof GainNode) node.gain.setValueAtTime(n, this.audioContext.currentTime) })
    }
    else throw new Error('InvalidNumber')
  }

  get waveType() { return this._waveType }
  set waveType(t) {
    if (t === 'sine' || t === 'square' || t === 'sawtooth' || t === 'triangle' || t === 'custom') {
      this._waveType = t
      localStorage.setItem('waveType', t)
      this.oscillators.forEach(osc => { if (osc instanceof OscillatorNode) osc.type = t })
    }
    else throw new Error('InvalidWaveType')
  }

  get A4() { return this._A4 }
  set A4(n) {
    if (typeof n === 'number' && 400 <= n && n <= 500) {
      this._A4 = n
      localStorage.setItem('A4', `${n}`)
    }
    else throw new Error('InvalidNumber')
  }

  get NOTE_C() { return 0 }
  get NOTE_Cis() { return 1 } get NOTE_Des() { return 1 } get NOTE_Db() { return 1 }
  get NOTE_D() { return 2 }
  get NOTE_Dis() { return 3 } get NOTE_Es() { return 3 } get NOTE_Eb() { return 3 }
  get NOTE_E() { return 4 } get NOTE_Fb() { return 4 }
  get NOTE_F() { return 5 }
  get NOTE_Fis() { return 6 } get NOTE_Ges() { return 6 } get NOTE_Gb() { return 6 }
  get NOTE_G() { return 7 }
  get NOTE_Gis() { return 8 } get NOTE_As() { return 8 } get NOTE_Ab() { return 8 }
  get NOTE_A() { return 9 }
  get NOTE_Ais() { return 10 } get NOTE_Bb() { return 10 }
  get NOTE_B() { return 11 } get NOTE_H() { return 11 } get NOTE_Cb() { return 11}
  get OCTAVE() { return 12 }

  get tuningSystem() { return this._tuningSystem }
  set tuningSystem(t) {
    if (t === 'equal-tempered' ||
      t === 'pure-tempered-major' ||
      t === 'pure-tempered-minor') return this._tuningSystem = t
    else throw new Error('InvalidTuningSystem')
  }

  get rootNote() { return this._rootNote }
  set rootNote(n) {
    if (this.NOTE_C <= n && n < this.OCTAVE) this._rootNote = n
    else throw new Error('InvalidNote')
  }

  get NOT_PUSHED() { return 0 }
  get PUSHED() { return 1 }

  get mouseState() { return this._mouseState }
  set mouseState(s) { if (s === this.NOT_PUSHED || s === this.PUSHED) this._mouseState = s }

  get notesCount() { return this.keyStates.reduce((acc, cur) => { return (cur === this.PUSHED)? acc+1: acc }, 0) }

  /**
   * Convert PC key to index of notes.
   * @param {string} k Charactor.
   */
  pcKeyToIndex(k) { return (this._keyMap.has(k))? this._keyMap.get(k): -1 }

  /**
   * Calculate detune.
   * @param {number} i Index of notes.(C is zero)
   */
  getDetune(i) {
    if (this.tuningSystem === 'equal-tempered') return 0
    i = i % 12
    let dif = i - this.rootNote
    if (dif < 0) dif += this.OCTAVE
    return (this._detune.get(this.tuningSystem)[dif] - dif) * 100
  }

  /**
   * Calculate each note pitch.
   * @param {number} i Index of notes.(C is zero)
   * @returns {number} Note's frequency.
   */
  calcPitch(i) {
    return this.A4 * Math.pow(2, (i-9)/12)
  }

  constructor() {
    // private fields
    this._audioContext = null
    this._masterVolume = 0.5
    this._soundVolume = 0.5
    this._waveType = localStorage.getItem('waveType') || 'sine'
    this._A4 = parseFloat(localStorage.getItem('A4')) || 440
    this._tuningSystem = 'equal-tempered'
    this._rootNote = this.NOTE_C
    this._mouseState = this.NOT_PUSHED
    this._keyMap = new Map([
      ['q',0],['2',1],['w',2],['3',3],['e',4],['r',5],['5',6],['t',7],['6',8],['y',9],['7',10],['u',11],['i',12],
      ['z',12],['s',13],['x',14],['d',15],['c',16],['v',17],['g',18],['b',19],['h',20],['n',21],['j',22],['m',23],[',',24]
    ])
    this._detune = new Map([
      ['equal-tempered', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
      ['pure-tempered-major', [12 * Math.log2(1/1), 12 * Math.log2(16/15), 12 * Math.log2(9/8), 12 * Math.log2(6/5), 12 * Math.log2(5/4), 12 * Math.log2(4/3), 12 * Math.log2(45/32), 12 * Math.log2(3/2), 12 * Math.log2(8/5), 12 * Math.log2(5/3), 12 * Math.log2(9/5), 12 * Math.log2(15/8)]],
      ['pure-tempered-minor', [12 * Math.log2(1/1), 12 * Math.log2(16/15), 12 * Math.log2(9/8), 12 * Math.log2(6/5), 12 * Math.log2(5/4), 12 * Math.log2(4/3), 12 * Math.log2(45/32), 12 * Math.log2(3/2), 12 * Math.log2(8/5), 12 * Math.log2(5/3), 12 * Math.log2(9/5), 12 * Math.log2(15/8)]]
    ])

    this.gainNodes = []
    this.oscillators = []

    this.$main = document.querySelector('#main')

    // set setting events
    // master volume
    document.querySelector('#masterVolume').addEventListener('change', ev => {console.log(ev)
      this.masterVolume = parseFloat(ev.target.value)
      console.log(this.masterVolume)
    })
    //sound volume
    document.querySelector('#soundVolume').addEventListener('change', ev => {
      this.soundVolume = parseFloat(ev.target.value)
      console.log(this.soundVolume)
    })
    // wave type
    document.querySelectorAll('.wave-type').forEach($e => {
      if (this.waveType === $e.value) $e.click()
      $e.addEventListener('change', ev => {
        this.waveType = ev.target.value
        console.log(this.waveType)
      })
    })
    // standard pitch
    const $tuningRange = document.querySelector('#tuningRange')
    const $tuningNumber = document.querySelector('#tuningNumber')
    $tuningRange.value = this.A4
    $tuningRange.addEventListener('change', ev => {
      this.A4 = $tuningNumber.value = parseFloat($tuningRange.value)
      console.log(this.A4)
    })
    $tuningNumber.value = this.A4
    $tuningNumber.addEventListener('change', ev => {
      this.A4 = $tuningRange.value = parseFloat($tuningNumber.value)
      console.log(this.A4)
    })
    // tuning system
    document.querySelectorAll('.tuning-system').forEach($e => $e.addEventListener('change', ev => {
      this.tuningSystem = ev.target.value
      console.log(this.tuningSystem)
    }))
    // root
    document.querySelectorAll('.key-select').forEach(($e, index) => $e.addEventListener('change', ev => {
      this.rootNote = index % this.OCTAVE
      console.log(this.rootNote)
    }))

    // initialize keyboard
    this.keyStates = []
    this.$keyboard = document.querySelector('#keyboard')
    this.keys = document.querySelectorAll('.key')
    // set mouse events
    this.$keyboard.addEventListener('mouseleave', ev => {
      if (this.mouseState === this.PUSHED) this.mouseState = this.NOT_PUSHED
    })
    this.keys.forEach(($key, index) => {
      this.gainNodes[index] = this.oscillators[index] = null
      $key.dataset.keyIndex = index
      this.keyUp($key)

      $key.addEventListener('mousedown', ev => {
        this.mouseState = this.PUSHED
        this.keyDown($key)
      })
      $key.addEventListener('mouseup', ev => {
        this.mouseState = this.NOT_PUSHED
        this.keyUp($key)
      })
      $key.addEventListener('mouseover', ev => {
        if (this.mouseState === this.PUSHED) this.keyDown($key)
      })
      $key.addEventListener('mouseout', ev => {
        if (this.mouseState === this.PUSHED) this.keyUp($key)
      })
    })
    // set keyboard events
    document.body.addEventListener('keydown', ev => {
      if (document.activeElement === $tuningNumber) return
      if (ev.repeat || ev.altKey || ev.ctrlKey || ev.metaKey) return
      const pitchIndex = this.pcKeyToIndex(ev.key)
      if (pitchIndex !== -1) this.keyDown(this.keys[pitchIndex])
    })
    document.body.addEventListener('keyup', ev => {
      if (document.activeElement === $tuningNumber) return
      const pitchIndex = this.pcKeyToIndex(ev.key)
      if (pitchIndex !== -1) this.keyUp(this.keys[pitchIndex])
    })
  }

  /**
   * Reset status and call update.
   * @param {Element} $key HTML Key Element.
   */
  keyDown($key) {
    this.keyStates[$key.dataset.keyIndex] = this.PUSHED
    $key.dataset.selectState = this.PUSHED
    this.update()
  }
  /**
   * Reset status and call update.
   * @param {Element} $key HTML Key Element.
   */
  keyUp($key) {
    this.keyStates[$key.dataset.keyIndex] = this.NOT_PUSHED
    $key.dataset.selectState = this.NOT_PUSHED
    this.update()
  }

  /**
   * Update status sound and chord.
   */
  update() {
    this.keyStates.forEach((key, index) => {
      if (key === this.PUSHED && this.oscillators[index] === null) {
        this.startSound(index)
      }
      if (key === this.NOT_PUSHED && this.oscillators[index] !== null) {
        this.stopSound(index)
      }
    })
    this.chordCheck()
  }

  /**
   * Start sound that specified note.
   * @param {number} n Index of notes.(C is zero)
   */
  startSound(n) {
    if (!this.gainNodes[n]) {
      this.gainNodes[n] = this.audioContext.createGain()
      this.gainNodes[n].gain.setValueAtTime(this.soundVolume, this.audioContext.currentTime)
      this.gainNodes[n].connect(this.output)
    }
    this.oscillators[n] = this.audioContext.createOscillator()
    this.oscillators[n].frequency.setValueAtTime(this.calcPitch(n), this.audioContext.currentTime)
    this.oscillators[n].detune.setValueAtTime(this.getDetune(n), this.audioContext.currentTime)
    this.oscillators[n].type = this.waveType
    this.oscillators[n].connect(this.gainNodes[n])
    this.oscillators[n].start()
  }

  /**
   * Stop sound that specified note.
   * @param {number} n Index of notes.(C is zero)
   */
  stopSound(n) {
    this.oscillators[n].stop()
    this.oscillators[n].disconnect()
    this.oscillators[n] = null
  }

  /**
   * Check chord and set current root note.
   */
  chordCheck() {
    if (this.notesCount < 3) return
    const rootCandidates = this.keyStates.map(this.isRootNote.bind(this))
    const maxPotential = Math.max(...rootCandidates)
    if (maxPotential === 0) return
    this.rootNote = rootCandidates.indexOf(maxPotential) % this.OCTAVE
    console.log(rootCandidates)
    document.querySelectorAll('.key-select')[this.rootNote].click()
    document.querySelectorAll('.note-detune').forEach(($e, index) => {
      $e.textContent = Math.round(this.getDetune(index) * 10) / 10
    })
  }

  /**
   * Returns the probability that the specified note is the root note as a numerical value.
   * @param {any} _ PUSHED or NOT_PUSHED.
   * @param {number} i Index. It means note.
   * @returns {number} Probability that the specified note is the root.
   */
  isRootNote(_, i) {
    if (this.keyStates[i] === this.NOT_PUSHED) return 0
    // root candidate
    i = i % this.OCTAVE
    // 3rd candidate
    const major3rd1 = (i + 4) % this.OCTAVE
    const major3rd2 = major3rd1 + this.OCTAVE
    const minor3rd1 = (i + 3) % this.OCTAVE
    const minor3rd2 = minor3rd1 + this.OCTAVE
    // 5th candidate
    const perfect5th1 = (i + 7) % this.OCTAVE
    const perfect5th2 = perfect5th1 + this.OCTAVE
    let potential = 0

    if (this.keyStates[perfect5th1] === this.PUSHED || this.keyStates[perfect5th2] === this.PUSHED) {
      if (this.keyStates[major3rd1] === this.PUSHED || this.keyStates[major3rd2] === this.PUSHED) potential += 3
      else if (this.keyStates[minor3rd1] === this.PUSHED || this.keyStates[minor3rd2] === this.PUSHED) potential += 2
    }
    return potential
  }
}