const loadingMessage = document.getElementById('loading-message');
const fileList = document.getElementById('file-list');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = 1.5;
let currentFileId = null;

function showLoadingMessage() {
    loadingMessage.style.display = 'block';
}

function hideLoadingMessage() {
    loadingMessage.style.display = 'none';
}

function fetchFiles() {
    showLoadingMessage();

    fetch('https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec') // Remplacez par l'URL de votre Web App
        .then(response => response.json())
        .then(files => {
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file.fileId;
                option.textContent = file.fileName;
                fileList.appendChild(option);
            });
        })
        .catch(error => {
            alert('Erreur lors du chargement des fichiers.');
            console.error(error);
        })
        .finally(() => {
            hideLoadingMessage();
        });
}

function loadPDF(fileId) {
    showLoadingMessage();

    fetch(`https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec?fileId=${fileId}`) // Remplacez par l'URL de votre Web App
        .then(response => response.json())
        .then(data => {
            const url = data.fileUrl;
            pdfjsLib.getDocument(url).promise.then(function (pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                renderPage(currentPage);
            });
        })
        .catch(error => {
            alert('Erreur lors du chargement du fichier PDF.');
            console.error(error);
        })
        .finally(() => {
            hideLoadingMessage();
        });
}

function renderPage(pageNum) {
    pdfDoc.getPage(pageNum).then(function (page) {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        page.render({
            canvasContext: ctx,
            viewport: viewport,
        });
    });
}

document.getElementById('load-pdf').addEventListener('click', function () {
    const selectedFileId = fileList.value;
    if (selectedFileId) {
        currentFileId = selectedFileId;
        loadPDF(selectedFileId);
    }
});

document.getElementById('prev').addEventListener('click', function () {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
});

document.getElementById('next').addEventListener('click', function () {
    if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
    }
});

document.getElementById('save-progress').addEventListener('click', function () {
    const progress = currentPage;
    const userId = '1'; // Exemple d'ID utilisateur

    fetch('https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec', { // Remplacez par l'URL de votre Web App
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
            fileId: currentFileId,
            progress: progress
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert('Progression sauvegardée : ' + data.result);
    });
});

fetchFiles();
