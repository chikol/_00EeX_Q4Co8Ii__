let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = 1.5;
let currentFileId = null;

const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');

// Récupérer la liste des fichiers depuis Google Apps Script
fetch('https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec')  // Remplacez par l'URL de votre Web App
    .then(response => response.json())
    .then(files => {
        const fileList = document.getElementById('file-list');
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.fileId;
            option.textContent = file.fileName;
            fileList.appendChild(option);
        });
    });

// Fonction pour charger un PDF
document.getElementById('load-pdf').addEventListener('click', function () {
    const selectedFileId = document.getElementById('file-list').value;
    if (selectedFileId) {
        currentFileId = selectedFileId;
        loadPDF(selectedFileId);
    }
});

// Charger le PDF choisi
function loadPDF(fileId) {
    // URL de votre fichier PDF (dans votre liste Google Sheets)
    fetch(`https://script.google.com/macros/s/AKfycbx.../exec?fileId=${fileId}`)
        .then(response => response.json())
        .then(data => {
            const url = data.fileUrl;  // Récupérer l'URL du fichier PDF
            pdfjsLib.getDocument(url).promise.then(function (pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                renderPage(currentPage);
            });
        });
}

// Afficher la page du PDF
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

// Sauvegarder la progression
document.getElementById('save-progress').addEventListener('click', function () {
    const progress = currentPage;
    const userId = '1';  // Exemple d'ID utilisateur

    fetch('https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec', {  // Remplacez par l'URL de votre Web App
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
