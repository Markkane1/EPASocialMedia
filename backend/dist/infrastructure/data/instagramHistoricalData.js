"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTAGRAM_28D_REACH = exports.INSTAGRAM_28D_VIEWS = exports.INSTAGRAM_28D_DATES_SHORT = exports.INSTAGRAM_28D_DATES_FULL = exports.INSTAGRAM_7D_FOLLOWS = exports.INSTAGRAM_7D_VISITS = exports.INSTAGRAM_7D_LINK_CLICKS = exports.INSTAGRAM_7D_INTERACTIONS = exports.INSTAGRAM_7D_REACH = exports.INSTAGRAM_7D_VIEWS = exports.INSTAGRAM_7D_DATES_SHORT = exports.INSTAGRAM_7D_DATES_FULL = void 0;
exports.getInstagram7dTrends = getInstagram7dTrends;
exports.getInstagramHistoricalTrends = getInstagramHistoricalTrends;
// --- 7-Day Meta Suite Data (14 Sep 2026 - 20 Sep 2026) ---
exports.INSTAGRAM_7D_DATES_FULL = [
    'Mon, 14 Sep', 'Tue, 15 Sep', 'Wed, 16 Sep', 'Thu, 17 Sep', 'Fri, 18 Sep', 'Sat, 19 Sep', 'Sun, 20 Sep'
];
exports.INSTAGRAM_7D_DATES_SHORT = [
    '14 Sep', '15 Sep', '16 Sep', '17 Sep', '18 Sep', '19 Sep', '20 Sep'
];
// Views: 83.6K total (+357.4%) [Facebook: 69,328, Instagram: 14,317]
exports.INSTAGRAM_7D_VIEWS = [
    9200, 9600, 16400, 9800, 6200, 16800, 15645
];
// Reach: 2.8K total (+33.1%) [Peak 19 Sep ~1.2K]
exports.INSTAGRAM_7D_REACH = [
    280, 480, 690, 520, 490, 1180, 460
];
// Content interactions: 334 total (-23.7%) [Peak 17 Sep = 75, 19 Sep = 68; Dip 18 Sep = 24]
exports.INSTAGRAM_7D_INTERACTIONS = [
    52, 40, 44, 75, 24, 68, 31
];
// Link clicks: 0 total (0%)
exports.INSTAGRAM_7D_LINK_CLICKS = [
    0, 0, 0, 0, 0, 0, 0
];
exports.INSTAGRAM_7D_VISITS = [
    18, 22, 34, 20, 14, 21, 13
];
exports.INSTAGRAM_7D_FOLLOWS = [
    2, 3, 5, 4, 3, 4, 3
];
function getInstagram7dTrends() {
    return exports.INSTAGRAM_7D_DATES_FULL.map((d, i) => ({
        date: d,
        views: exports.INSTAGRAM_7D_VIEWS[i],
        viewers: exports.INSTAGRAM_7D_REACH[i],
        reach: exports.INSTAGRAM_7D_REACH[i],
        impressions: Math.round(exports.INSTAGRAM_7D_VIEWS[i] * 1.08),
        interactions: exports.INSTAGRAM_7D_INTERACTIONS[i],
        linkClicks: exports.INSTAGRAM_7D_LINK_CLICKS[i],
        visits: exports.INSTAGRAM_7D_VISITS[i],
        follows: exports.INSTAGRAM_7D_FOLLOWS[i]
    }));
}
// --- 28-Day Data (24 Aug 2026 - 20 Sep 2026) ---
exports.INSTAGRAM_28D_DATES_FULL = [
    'Mon, 24 Aug', 'Tue, 25 Aug', 'Wed, 26 Aug', 'Thu, 27 Aug', 'Fri, 28 Aug', 'Sat, 29 Aug', 'Sun, 30 Aug',
    'Mon, 31 Aug', 'Tue, 1 Sep', 'Wed, 2 Sep', 'Thu, 3 Sep', 'Fri, 4 Sep', 'Sat, 5 Sep', 'Sun, 6 Sep',
    'Mon, 7 Sep', 'Tue, 8 Sep', 'Wed, 9 Sep', 'Thu, 10 Sep', 'Fri, 11 Sep', 'Sat, 12 Sep', 'Sun, 13 Sep',
    'Mon, 14 Sep', 'Tue, 15 Sep', 'Wed, 16 Sep', 'Thu, 17 Sep', 'Fri, 18 Sep', 'Sat, 19 Sep', 'Sun, 20 Sep'
];
exports.INSTAGRAM_28D_DATES_SHORT = [
    '24 Aug', '25 Aug', '26 Aug', '27 Aug', '28 Aug', '29 Aug', '30 Aug',
    '31 Aug', '1 Sep', '2 Sep', '3 Sep', '4 Sep', '5 Sep', '6 Sep',
    '7 Sep', '8 Sep', '9 Sep', '10 Sep', '11 Sep', '12 Sep', '13 Sep',
    '14 Sep', '15 Sep', '16 Sep', '17 Sep', '18 Sep', '19 Sep', '20 Sep'
];
exports.INSTAGRAM_28D_VIEWS = [
    1230, 1560, 1340, 1730, 1450, 1230, 1120,
    1400, 1680, 1950, 2680, 4190, 6990, 5480,
    3080, 2570, 2350, 2520, 3630, 2120, 1790,
    9200, 9600, 16400, 9800, 6200, 16800, 15645
];
exports.INSTAGRAM_28D_REACH = [
    125, 160, 135, 175, 148, 125, 115,
    142, 171, 200, 273, 428, 712, 558,
    314, 262, 240, 257, 370, 216, 182,
    280, 480, 690, 520, 490, 1180, 460
];
function getInstagramHistoricalTrends() {
    return exports.INSTAGRAM_28D_DATES_FULL.map((d, i) => ({
        date: d,
        views: exports.INSTAGRAM_28D_VIEWS[i],
        viewers: exports.INSTAGRAM_28D_REACH[i],
        reach: exports.INSTAGRAM_28D_REACH[i],
        impressions: Math.round(exports.INSTAGRAM_28D_VIEWS[i] * 1.05),
        interactions: i >= 21 ? exports.INSTAGRAM_7D_INTERACTIONS[i - 21] : Math.round(exports.INSTAGRAM_28D_VIEWS[i] * 0.0225),
        linkClicks: i >= 21 ? exports.INSTAGRAM_7D_LINK_CLICKS[i - 21] : Math.max(0, Math.round(exports.INSTAGRAM_28D_VIEWS[i] * 0.001)),
        visits: i >= 21 ? exports.INSTAGRAM_7D_VISITS[i - 21] : Math.round(exports.INSTAGRAM_28D_REACH[i] * 0.105),
        follows: i >= 21 ? exports.INSTAGRAM_7D_FOLLOWS[i - 21] : Math.max(1, Math.round(exports.INSTAGRAM_28D_REACH[i] * 0.015))
    }));
}
