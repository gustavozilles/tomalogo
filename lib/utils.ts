export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

export function getStartOfDay(date: Date = new Date()) {
    const start = new Date(date);
    // Set to 03:00 UTC, which corresponds to 00:00 BRT (UTC-3)
    // This ensures we ignore doses from the previous night (e.g. 21:00 BRT = 00:00 UTC)
    start.setUTCHours(3, 0, 0, 0);
    return start;
}

export function parseTime(timeStr: string): { hour: number; minute: number } | null {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m)) return null;
    return { hour: h, minute: m };
}
