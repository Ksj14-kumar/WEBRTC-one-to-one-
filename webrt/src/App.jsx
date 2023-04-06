import { useEffect, useReducer, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { io } from "socket.io-client"
const socket = io("http://localhost:6600/")
function App() {
  const [count, setCount] = useState(0)
  const localStreamVideoRef = useRef(null)
  const remoteStreamVideoRef = useRef(null)
  let localStream;
  const pc = useRef()
  const textRef = useRef(null)
  const candidateRef = useRef([])


  useEffect(() => {
    socket.on("data", (data) => {
      textRef.current.value = JSON.stringify(data.sdp)
    })
    socket.on("candidate", (candi) => {
      candidateRef.current=[...candidateRef.current,candi]
    })
    const constraints = {
      audio: false,
      video: true
    }
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        localStreamVideoRef.current.srcObject = stream
        localStream = stream
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream)
        })
      })
      .catch((err) => {
        console.log(err)
      })
    const peerConnection = new RTCPeerConnection(null)
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("candidate", e.candidate)
      }
    }
    peerConnection.oniceconnectionstatechange = (e) => {
      //check ice connection state change of peer, value are, closed, failed, disconnect, connect
    }
    peerConnection.ontrack = (e) => {
      //we get remove peer inside this
      remoteStreamVideoRef.current.srcObject = e.streams[0]
    }
    pc.current = peerConnection
  }, [])


  const createOffer = () => {
    pc.current.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1 })
      .then(sdp => {
        pc.current.setLocalDescription(sdp)
        socket.emit("sdp", { sdp })
      })
      .catch((err) => {
        console.log(err)
      })
  }
  const createAnswer = () => {
    pc.current.createAnswer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1 })
      .then(sdp => {
        socket.emit("sdp", { sdp })
        pc.current.setLocalDescription(sdp)
      })
      .catch((err) => {
        console.log(err)
      })
  }
  const setRemote = () => {
    const sdp = JSON.parse(textRef.current.value)
    pc.current.setRemoteDescription(new RTCSessionDescription(sdp))
  }
  const addIceCandidate = () => {
    candidateRef.current.forEach((candidates)=>{
      console.log(candidates)
      pc.current.addIceCandidate(new RTCIceCandidate(candidates))
    })
  }

  const onStop = () => {
    localStream.getTracks().forEach((track) => {
      if (track.readyState == 'live' && track.kind === 'video') {
        track.stop();
      }
    })
  }


  return (
    <div className="App">
      <div className="videoconfrence" style={{ display: 'flex' }}>
        <video ref={localStreamVideoRef} autoPlay controls style={{ width: "300px", height: "300px", marginRight: "50px" }} >
          <source />
        </video>
        <video ref={remoteStreamVideoRef} autoPlay controls style={{ width: "300px", height: "300px" }}>
          <source />
        </video>
      </div>
      <textarea name="" id="" cols="30" rows="10" ref={textRef}></textarea>

      <div className="wrapper">
        <button onClick={createOffer}>Offer</button>
        <button onClick={createAnswer}>Answer</button>
        <button onClick={setRemote}>Set Remote description</button>
        <button onClick={addIceCandidate}>add Candidate</button>
        <button onClick={onStop}>Stop Video</button>
      </div>

    </div>
  )
}

export default App
