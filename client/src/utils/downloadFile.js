const downloadFile = async (documentId, fileName) => {
  try {
    const token = localStorage.getItem('accessToken');
    const url   = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/documents/${documentId}/download`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = blobUrl;
    a.download    = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download error:', err);
    alert('Download failed. Please try again.');
  }
};

export default downloadFile;
