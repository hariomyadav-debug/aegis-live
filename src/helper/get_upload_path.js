function get_upload_path(filename) {

    // If empty, null, undefined → return empty string
    if (!filename || filename.trim() === "") {
        return "";
    }

    // If already a full URL → return same
    if (filename.includes("http")) {
        return filename;
    }

    // Else add base path
    const BASE_URL = ;
    return BASE_URL + filename;
}

module.exports = get_upload_path;
