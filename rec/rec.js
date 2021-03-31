const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('../models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models')
]).then(startVideo)

async function startVideo() {
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )

  //http://rapport.bodo.kommune.no/rh_dg15_fullsize.htm



video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)

    // Finner match
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    
    // Skriver match
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      if(result.toString().includes("unknown") !== true) console.log(`Funnet person: ${result.toString()}`)
      drawBox.draw(canvas)
    })
  }, 100)
})
}

function loadLabeledImages() {
  const labels = ['kjell-ivar', 'karin']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 23; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/imomo0/FaceRecognition/master/picture/faces/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        if(detections !== undefined) descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
