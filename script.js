const loadingMessage = document.getElementById('loading-message');
const fileList = document.getElementById('file-list');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
let pdfDoc = null;
let currentPage = 1;
let progressPage=1;
let totalPages = 0;
let scale = 1.5;
let currentFileId = null;
let currentUserId = '1'; // Remplacez par la logique d'identification de l'utilisateur

// URL de votre Web App Apps Script
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxe7mhjz0n4_CGUecKlJoUsmQSRcXVrIarjeLYm0MGY1hb9N2cXSiz-y8IJBp1U_rk7/exec';

function showLoadingMessage() {
    loadingMessage.style.display = 'block';
}

function hideLoadingMessage() {
    loadingMessage.style.display = 'none';
}

// 🔄 Récupère la liste des fichiers PDF
function fetchFiles() {
    showLoadingMessage();

    fetch(`${APPSCRIPT_URL}?action=getAll`)
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
            toggleOverlay(false);  // ⛔ activer l'interface
        
        });
        
}

// 🔄 Charge le PDF sélectionné
function loadPDF(fileId) {
    showLoadingMessage();
    toggleOverlay(true);  // ⛔ activer l'interface

    // Ici, on suppose que le fichier PDF est directement accessible via l’URL
    fetch(`${APPSCRIPT_URL}?action=getAll&fileId=${fileId}`)
        .then(response => response.json())
        .then(files => {
            // Filtrer le fichier correspondant au fileId
            const file = files.find(f => f.fileId == fileId);

            if (!file) {
                alert('Fichier non trouvé');
                return;
            }

            const fileUrl = file.fileUrl;  // URL du fichier PDF
            console.log("URL du fichier:", fileUrl);
            console.log("progress du fichier:",file.fileProgress);
              console.log("file: ",file);
            // Charger le PDF
            pdfjsLib.getDocument(fileUrl).promise.then(function (pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                currentPage = file.fileProgress || 1;
                progressPage = currentPage;
                renderPage(currentPage); 
                // Récupérer la progression actuelle depuis Google Sheets
               // renderPage(getProgress(currentUserId, fileId));
            });
        })
        .catch(error => {
            alert('Erreur lors du chargement du fichier PDF.');
            console.error(error);
        })
        .finally(() => {
            hideLoadingMessage();
            toggleOverlay(false);  // ⛔ activer l'interface
            document.getElementById('div-bottom').style.display = 'flex';
        document.getElementById('pdf-container').style.display = 'block';
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

        // Met à jour l'indicateur de page
        document.getElementById('page-indicator').textContent = `Page: ${currentPage} / ${totalPages}`;
        
        // Met à jour la barre de progression
        const progress = (currentPage / totalPages) * 100;
        document.getElementById('progress-bar').value = progress;
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

document.getElementById('prog').addEventListener('click', function () {
  if (progressPage != 0) {
      currentPage=progressPage;
      renderPage(currentPage);

  }
});

// 💾 Sauvegarde de la progression
document.getElementById('save-progress').addEventListener('click', function () {
    if (!currentFileId) return;
    toggleOverlay(true);  // ⛔ activer l'interface
    console.log(`${APPSCRIPT_URL}?action=update&fileId=${currentFileId}&fileProgress=${currentPage}`);


      fetch(`${APPSCRIPT_URL}?action=update&fileId=${currentFileId}&fileProgress=${currentPage}`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.status === "success") {
          progressPage = currentPage;
          document.getElementById('result').innerText = `✔️ Progression mise à jour pour le fichier ${data.fileId}: ${data.updatedProgress}`;
          toggleOverlay(false);  // ⛔ activer l'interface
        } else {
          document.getElementById('result').innerText = `❌ Erreur: ${data.message}`;
          toggleOverlay(false);  // ⛔ activer l'interface
        }
      })
      .catch(error => {
        console.error("Erreur lors de la requête :", error);
        document.getElementById('result').innerText = "❌ Échec de la requête.";
        toggleOverlay(false);  // ⛔ activer l'interface
      });
    
    
  
});

function toggleOverlay(show) {
  document.getElementById('overlay').style.display = show ? 'flex' : 'none';
}



// ▶️ Initialisation au chargement
fetchFiles();
