// 定数
const MODE_BG_WHITE = 0
const MODE_BG_BLACK = 1

const brlWidth = 2
const brlHeight = 4

// 画像処理用とプレビュー用のCanvas
const image = new Image()
const bgCanvas = document.createElement('canvas')
const bgContext = bgCanvas.getContext('2d')
const fgCanvas = document.createElement('canvas')
const fgContext = fgCanvas.getContext('2d')

// グローバル変数
let backgroundMode = MODE_BG_WHITE
let colorThreshold = 127
let alphaThreshold = 127
let outputTextWidth = 100
let outputTextHeight = null
let xOffset = 0
let yOffset = 0

// 2x4のイメージデータから0と1のマップを作成
const remapAsBraille = ({ data }) => {
  const dotList = [0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < brlWidth * brlHeight; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    const a = data[i * 4 + 3]

    if (a >= alphaThreshold && (r + g + b) / 3 < colorThreshold) {
      dotList[i] = 1
    }
  }
  return dotList
}

// 2x4のイメージデータから点字に変換
const pixelsToChar = data => {
  const p = remapAsBraille(data)
  const dots = [p[7], p[6], p[5], p[3], p[1], p[4], p[2], p[0]]
  return String.fromCharCode(0x2800 + parseInt(dots.join(''), 2))
}

// 現在の設定から結果を出力する
const convert = () => {
  let outputData = ''
  for (let y = 0; y < outputTextHeight; y++) {
    for (let x = 0; x < outputTextWidth; x++) {
      const char = pixelsToChar(
        bgContext.getImageData(x * brlWidth, y * brlHeight, brlWidth, brlHeight)
      )
      outputData += char
    }
    outputData += '\n'
  }
  return outputData
}

// プレビューを再描画する
const render = () => {
  if (image.src === '') return

  // グリッドを描画
  fgContext.clearRect(0, 0, fgCanvas.width, fgCanvas.height)
  fgContext.fillStyle = 'rgba(' + [127, 127, 127, 0.2] + ')'
  for (let y = 0; y < outputTextHeight; y++) {
    for (let x = 0; x < outputTextWidth; x++) {
      fgContext.fillRect(
        x * brlWidth * 2,
        y * brlHeight * 2,
        brlWidth * 2 - 1,
        brlHeight * 2 - 1
      )
    }
  }

  // 点を描画
  fgContext.fillStyle = backgroundMode ? 'white' : 'black'
  for (let y = 0; y < outputTextHeight; y++) {
    for (let x = 0; x < outputTextWidth; x++) {
      const dots = remapAsBraille(
        bgContext.getImageData(x * brlWidth, y * brlHeight, brlWidth, brlHeight)
      )
      dots.forEach((dot, i) => {
        if (dot) {
          fgContext.fillRect(
            x * brlWidth * 2 + (i % brlWidth) * 2,
            y * brlHeight * 2 + Math.floor(i / 2) * 2,
            1,
            1
          )
        }
      })
    }
  }
}

// Canvasサイズを更新し、画像ファイルを再描画する
const canvasInit = () => {
  outputTextHeight = Math.ceil(
    (brlWidth * outputTextWidth * (image.height / image.width)) / brlHeight
  )

  bgCanvas.width = brlWidth * outputTextWidth
  bgCanvas.height = brlHeight * outputTextHeight
  bgContext.drawImage(image, xOffset, yOffset, bgCanvas.width, bgCanvas.height)

  fgCanvas.width = bgCanvas.width * 2
  fgCanvas.height = bgCanvas.height * 2
  render()
}

// src属性が更新されたらCanvasを初期化する
image.onload = canvasInit

// DOM読み込み後に実行
window.addEventListener('DOMContentLoaded', event => {
  // HTMLファイル内の要素
  const filepickerElement = document.getElementById('filepicker')
  const widthElement = document.getElementById('width')
  const colorThresholdElement = document.getElementById('cthreshold')
  const alphaThresholdElement = document.getElementById('athreshold')
  const xOffsetElement = document.getElementById('xoffset')
  const yOffsetElement = document.getElementById('yoffset')
  const backgroundElement = document.getElementById('background')
  const convertElement = document.getElementById('convert')
  const previewElement = document.getElementById('preview')
  const outputElement = document.getElementById('output')
  const copyElement = document.getElementById('copy')

  previewElement.appendChild(fgCanvas)

  // 各要素にイベントを追加
  // TODO 重複する表現を減らす
  filepickerElement.addEventListener('change',() => {
      const fileReader = new FileReader()
      fileReader.onload = () => {
        image.src = fileReader.result
      }
      fileReader.readAsDataURL(filepickerElement.files[0])
    },
    false
  )

  widthElement.addEventListener('input', () => {
    const newValue = parseInt(widthElement.value)
    if (newValue === outputTextWidth) retrun
    outputTextWidth = newValue
    canvasInit()
  })

  colorThresholdElement.addEventListener('change', () => {
    const newValue = parseInt(colorThresholdElement.value)
    if (newValue === colorThreshold) retrun
    colorThreshold = newValue
    render()
  })

  alphaThresholdElement.addEventListener('change', () => {
    const newValue = parseInt(alphaThresholdElement.value)
    if (newValue === alphaThreshold) retrun
    alphaThreshold = newValue
    render()
  })

  xOffsetElement.addEventListener('input', () => {
    const newValue = parseInt(xOffsetElement.value)
    if (newValue === xOffset) retrun
    xOffset = newValue
    canvasInit()
  })

  yOffsetElement.addEventListener('input', () => {
    const newValue = parseInt(yOffsetElement.value)
    if (newValue === yOffset) retrun
    yOffset = newValue
    canvasInit()
  })

  backgroundElement.addEventListener('input', () => {
    const newValue = parseInt(backgroundElement.value)
    if (newValue === backgroundMode) retrun
    backgroundMode = newValue
    document.body.className = backgroundMode ? 'bg-black' : 'bg-white'
    render()
  })

  convertElement.addEventListener('click', () => {
    const output = convert()
    outputElement.value = output
  })

  copyElement.addEventListener('click', () => {
    outputElement.select()
    document.execCommand('copy')
  })
})
