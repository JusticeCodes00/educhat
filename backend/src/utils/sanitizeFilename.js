// Sanitize filename to remove spaces and special characters
export const sanitizeFilename = (filename) => {
    // Remove spaces, special characters except dots and hyphens
    const sanitized = filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();

    return sanitized;
};