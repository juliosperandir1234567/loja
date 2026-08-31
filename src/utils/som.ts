let contextoAudio: AudioContext | null = null

function tocarTom(frequencia: number, duracaoMs: number) {
  try {
    contextoAudio ??= new AudioContext()
    const osc = contextoAudio.createOscillator()
    const ganho = contextoAudio.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequencia
    ganho.gain.setValueAtTime(0.2, contextoAudio.currentTime)
    ganho.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + duracaoMs / 1000)
    osc.connect(ganho)
    ganho.connect(contextoAudio.destination)
    osc.start()
    osc.stop(contextoAudio.currentTime + duracaoMs / 1000)
  } catch {
    // navegador pode bloquear audio sem interacao previa do usuario — ignora
  }
}

// bipe curto e agudo quando um produto e reconhecido pelo scanner
export function tocarBipSucesso() {
  tocarTom(880, 120)
}

// tom baixo quando o codigo escaneado nao corresponde a nenhum produto
export function tocarBipErro() {
  tocarTom(220, 220)
}
