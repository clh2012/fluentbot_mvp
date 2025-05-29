// voice-chat.js

const API_BASE = 'https://fluentbot-mvp-am46.vercel.app';

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const recordBtn = document.getElementById("recordBtn");
const status = document.getElementById("recordingStatus");
const audioPlayback = document.getElementById("audioPlayback");
const transcriptEl = document.getElementById("transcript");
const ttsAudio = document.getElementById("ttsAudio");
const chat = document.getElementById("chat");

recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      audioPlayback.src = URL.createObjectURL(blob);
      audioPlayback.style.display = "block";
      status.textContent = "Transcribing...";

      try {
        const response = await fetch(`${API_BASE}/api/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Transcription failed');

        const data = await response.json();
        const message = data.transcript || '';
        transcriptEl.value = message;
        status.textContent = "Transcription complete.";

        if (message) {
          sendToChat({ message });
        }
      } catch (err) {
        status.textContent = "Error during transcription.";
        console.error(err);
      }
    };

    mediaRecorder.start();
    isRecording = true;
    recordBtn.textContent = "🛑 Stop Recording";
    status.textContent = "Recording...";
    transcriptEl.value = "";
    ttsAudio.style.display = "none";
    ttsAudio.src = "";
  } catch (err) {
    console.error('Could not start recording:', err);
    status.textContent = 'Could not start recording. Please check microphone permissions.';
  }
}

function stopRecording() {
  mediaRecorder.stop();
  isRecording = false;
  recordBtn.textContent = "🎤 Start Recording";
  status.textContent = "Processing audio...";
}

function addMessage(text, role) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  msg.textContent = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

async function sendToChat(body) {
  if (body.message) addMessage(body.message, 'user');

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.reply) {
    addMessage(data.reply, 'assistant');

    const audioReplyBlob = new Blob(
      [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
      { type: 'audio/mpeg' }
    );
    const audioUrl = URL.createObjectURL(audioReplyBlob);
    const audio = new Audio(audioUrl);
    audio.onended = () => {
      // Automatically start listening again
      startRecording();
    };
    audio.play();
  } else {
    addMessage("⚠️ Error: No reply received", 'assistant');
  }
}
