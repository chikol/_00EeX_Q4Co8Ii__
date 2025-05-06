// Spécifie le chemin du worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

const loadingMessage = document.getElementById('loading-message');
const fileList = document.getElementById('file-list');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = 1.5;
let currentFileId = null;
let currentUserId = '1'; // Remplacez par la logique d'identification de l'utilisateur

// URL de l'API Google Apps Script
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec';

// Affiche le message de chargement
function showLoadingMessage() {
    loadingMessage.style.display = 'block';
}

// Cache le message de chargement
function hideLoadingMessage() {
    loadingMessage.style.display = 'none';
}

// 🔄 Récupère la liste des fichiers PDF
function fetchFiles() {
    showLoadingMessage();

    fetch(APPSCRIPT_URL)
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

// 🔄 Charge le PDF sélectionné
function loadPDF(fileId) {
    showLoadingMessage();

    // Utiliser fetch pour obtenir l'URL du PDF à partir de Google Sheets avec le fileId
    fetch(APPSCRIPT_URL + '?fileId=' + fileId)
        .then(response => response.json())
        .then(data => {
            // Vérifier si l'URL existe dans les données reçues
            const fileUrl = data.url;
            if (!fileUrl) {
                alert('URL du fichier non trouvée.');
                return;
            }

            // Charger le PDF avec l'URL récupérée
            pdfjsLib.getDocument(fileUrl).promise.then(function (pdf) {
                console.log(pdf);
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                currentPage = 1;
                renderPage(currentPage);

                // Récupérer la progression actuelle depuis Google Sheets
                getProgress(currentUserId, fileId);
            }).catch(error => {
                alert('Erreur lors du chargement du fichier PDF.');
                console.error(error);
            });
        })
        .catch(error => {
            alert('Erreur lors de la récupération de l\'URL du fichier.');
            console.error(error);
        })
        .finally(() => {
            hideLoadingMessage();
        });
}


// 🔄 Affiche la page actuelle du PDF
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

// ▶️ Bouton "Charger PDF"
document.getElementById('load-pdf').addEventListener('click', function () {
    const selectedFileId = fileList.value;
    if (selectedFileId) {
        currentFileId = selectedFileId;
        loadPDF(selectedFileId);
    }
});

// ◀️▶️ Navigation PDF
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

// 💾 Sauvegarde de la progression
document.getElementById('save-progress').addEventListener('click', function () {
    if (!currentFileId) return;

    const progress = currentPage;

    fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: currentUserId,
            fileId: currentFileId,
            progress: progress
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Progression sauvegardée : ' + data.result);
    })
    .catch(error => {
        alert("Erreur lors de la sauvegarde.");
        console.error(error);
    });
});

// 🔄 Récupère la progression depuis la feuille Google Sheets
function getProgress(userId, fileId) {
    fetch(APPSCRIPT_URL + '?userId=' + userId + '&fileId=' + fileId)
        .then(response => response.json())
        .then(data => {
            if (data.progress !== undefined) {
                currentPage = data.progress;
                renderPage(currentPage);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération de la progression:', error);
        });
}

// ▶️ Initialisation au chargement
fetchFiles();
