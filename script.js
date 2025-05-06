const loadingMessage = document.getElementById('loading-message');
const fileList = document.getElementById('file-list');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = 1.5;
let currentFileId = null;

// ✅ Liste statique des fichiers PDF
const files = [
    {
        fileId: "1",
        fileName: "Intelligence Emotionnelle",
        fileUrl: "https://tonsite.com/intelligence-emotionnelle.pdf"
    },
    {
        fileId: "2",
        fileName: "Communication Non Violente",
        fileUrl: "https://tonsite.com/communication-non-violente.pdf"
    }
];

// ✅ URL du script Apps Script pour le suivi de progression
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEz5JYSywYZXiG1kljdiBGHIs17bIq8jA64VZ1WSw31_AA50pEG92lyG6piVrGCL7U/exec';

// 🔄 Affiche un message de chargement
function showLoadingMessage() {
    loadingMessage.style.display = 'block';
}

function hideLoadingMessage() {
    loadingMessage.style.display = 'none';
}

// 🔄 Affiche la liste des fichiers dans la liste déroulante
function fetchFiles() {
    showLoadingMessage();

    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file.fileId;
        option.textContent = file.fileName;
        fileList.appendChild(option);
    });

    hideLoadingMessage();
}

// 🔄 Charge et affiche le PDF avec la progression depuis Google Sheets
function loadPDF(fileId) {
    showLoadingMessage();

    const selectedFile = files.find(f => f.fileId === fileId);
    if (!selectedFile) {
        alert("Fichier non trouvé !");
        hideLoadingMessage();
        return;
    }

    const userId = '1'; // Remplacez par un identifiant utilisateur réel

    // Étape 1 : récupérer la progression
    fetch(`${APPSCRIPT_URL}?fileId=${fileId}&userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            const savedPage = parseInt(data.progress) || 1;

            // Étape 2 : charger le PDF
            return fetch(selectedFile.fileUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Erreur réseau lors du chargement du PDF");
                    return response.blob();
                })
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    return pdfjsLib.getDocument(url).promise.then(function (pdf) {
                        pdfDoc = pdf;
                        totalPages = pdf.numPages;
                        currentPage = savedPage <= totalPages ? savedPage : 1;
                        renderPage(currentPage);
                    });
                });
        })
        .catch(error => {
            alert('Erreur lors du chargement du fichier PDF ou de la progression.');
            console.error(error);
        })
        .finally(() => {
            hideLoadingMessage();
        });
}

// 🔄 Affiche une page spécifique du PDF
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

// ▶️ Bouton "Charger le fichier PDF"
document.getElementById('load-pdf').addEventListener('click', function () {
    const selectedFileId = fileList.value;
    if (selectedFileId) {
        currentFileId = selectedFileId;
        loadPDF(selectedFileId);
    }
});

// ◀️▶️ Navigation entre les pages
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

// 💾 Sauvegarde de la progression dans Google Sheets
document.getElementById('save-progress').addEventListener('click', function () {
    if (!currentFileId) return;

    const userId = '1'; // À adapter
    const progress = currentPage;

    fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
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

// ▶️ Initialisation au chargement de la page
fetchFiles();
