const loadingMessage = document.getElementById('loading-message');
const fileList = document.getElementById('file-list');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = 1.5;
let currentFileId = null;

// URL de votre Web App Apps Script
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec';

function showLoadingMessage() {
    loadingMessage.style.display = 'block';
}

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

    // Ici, on suppose que le fichier PDF est directement accessible via l’URL
    fetch(`${APPSCRIPT_URL}?fileId=${fileId}`)
        .then(response => response.json())
        .then(data => {
            const url = data.fileUrl;
            pdfjsLib.getDocument(url).promise.then(function (pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                currentPage = 1;
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

    const userId = '1'; // Remplacez par votre logique utilisateur
    const progress = currentPage;

    fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain' // ✅ évite la requête OPTIONS
        },
        body: JSON.stringify({
            userId: userId,
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

// ▶️ Initialisation au chargement
fetchFiles();
