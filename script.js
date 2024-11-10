async function mergeFiles() {
    const imageInput = document.getElementById('imageInput').files[0];
    const audioInput = document.getElementById('audioInput').files[0];

    if (!imageInput || !audioInput) {
        alert('يرجى تحميل صورة وملف صوتي.');
        return;
    }

    const imageURL = URL.createObjectURL(imageInput);
    const audioURL = URL.createObjectURL(audioInput);

    // إعداد عناصر الوسائط
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audio = new Audio(audioURL);
    const audioSource = audioContext.createMediaElementSource(audio);
    const destination = audioContext.createMediaStreamDestination();
    audioSource.connect(destination);
    audioSource.connect(audioContext.destination);

    const image = new Image();
    image.src = imageURL;

    // انتظار تحميل الصورة
    await new Promise((resolve) => (image.onload = resolve));

    // إعداد Canvas لرسم الفيديو
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // إنشاء Stream من Canvas ودمجه مع الصوت
    const canvasStream = canvas.captureStream(30); // معدل الإطارات 30 FPS
    const audioStream = destination.stream;
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioStream.getAudioTracks()]);

    const mediaRecorder = new MediaRecorder(combinedStream);
    const chunks = [];

    // جمع البيانات المسجلة
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    // بدء التسجيل
    mediaRecorder.start();

    // تشغيل الصوت ورسم الصورة بشكل مستمر
    audio.play();
    const drawInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }, 1000 / 30); // رسم بمعدل 30 FPS

    // انتظار انتهاء الصوت
    audio.onended = () => {
        clearInterval(drawInterval);
        mediaRecorder.stop();
    };

    // عند انتهاء التسجيل
    mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/mp4' });
        const videoURL = URL.createObjectURL(videoBlob);
        const resultVideo = document.getElementById('resultVideo');
        resultVideo.src = videoURL;
        resultVideo.style.display = 'block';

        // تنزيل الفيديو تلقائيًا
        const link = document.createElement('a');
        link.href = videoURL;
        link.download = 'merged-video.mp4';
        link.click();
    };
}
