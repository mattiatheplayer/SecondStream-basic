<?php
require __DIR__ . '/vendor/autoload.php';
use getID3;

try {
    $dir = 'mp3';
    $files = array_diff(scandir($dir), array('.', '..'));
    $mp3Files = array_values($files);

    // Aggiunta della gestione di offset e limit
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

    // Limitazione dei file restituiti
    $files = array_slice($mp3Files, $offset, $limit);

    $data = [];
    $getID3 = new getID3;

    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'mp3') {
            $filePath = $dir . '/' . $file;
            $fileInfo = $getID3->analyze($filePath);

            $coverArt = null;
            if (isset($fileInfo['comments']['picture'][0]['data'])) {
                $coverArt = 'data:image/' . $fileInfo['comments']['picture'][0]['image_mime'] . ';base64,' . base64_encode($fileInfo['comments']['picture'][0]['data']);
            }

            $title = isset($fileInfo['tags']['id3v2']['title'][0]) ? $fileInfo['tags']['id3v2']['title'][0] : pathinfo($file, PATHINFO_FILENAME);
            $artist = isset($fileInfo['tags']['id3v2']['artist'][0]) ? $fileInfo['tags']['id3v2']['artist'][0] : '';
            $album = isset($fileInfo['tags']['id3v2']['album'][0]) ? $fileInfo['tags']['id3v2']['album'][0] : '';

            $artists = array_map('trim', explode('/', $artist));

            $data[] = [
                'file' => $file,
                'coverArt' => $coverArt,
                'title' => $title,
                'artist' => $artists,
                'album' => $album
            ];
        }
    }

    header('Content-Type: application/json');
    echo json_encode($data);
} catch (Exception $e) {
    error_log('Error: ' . $e->getMessage());
    echo json_encode(['error' => 'Si è verificato un errore.']);
}
?>
