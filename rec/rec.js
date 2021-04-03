
const video = document.getElementById('video')

let arr = ["hvem", "outdoor_temp", "test"];

httpGET("http://localhost:1880/global", "arr");

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
  console.log(labeledFaceDescriptors);
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )


video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize);
  let seenArray = [];
  let nextReset = 0;
  const timeReset = 2000;

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)

    // Finner match
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    
    // Timestamp
    var d = new Date();
    var n = d.getTime();

    // Skriver match
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      if(result.toString().includes("unknown") !== true) 
      {
        var name = result.toString().substring(0, result.toString().indexOf(' '));
        nextReset = n + timeReset;

        if(seenArray.includes(name) !== true)
        {  
          seenArray.push(name);
          httpPOST("hvem",name);
        }
      }
      drawBox.draw(canvas)

    })
    if(seenArray.length !== 0 && n > nextReset)
    {
      seenArray = [];
      httpPOST("hvem","");
    }
  }, 100)
})
}

async function loadLabeledImages() {
  const labels = ['kjell-ivar', 'karin']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/imomo0/FaceRecognition/master/picture/faces/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        if(detections !== undefined) descriptions.push(detections.descriptor)
      }
      let loadedLables = new faceapi.LabeledFaceDescriptors(label, descriptions)
      return loadedLables
    })
  )
}

function httpPOST(key, value) {
  const Http = new XMLHttpRequest();
  const url='http://localhost:1880/global';
  Http.open("POST", url);
  Http.send(JSON.stringify({ "key": key,"value": value }));

  Http.onreadystatechange = (e) => {
    console.log(Http.responseText)
  }
}

function httpGET(url, params, func) {
  const Http = new XMLHttpRequest();
  let urlParam = "";
  
  if(params !== undefined && typeof params !== "string")
  {
      urlParam += url + "?";
      params.forEach(param => {
      urlParam += param +"&";
      })
  }
  else urlParam = url + "?" + params;
  Http.open("GET", urlParam);
  Http.send();
  Http.onreadystatechange = func

}