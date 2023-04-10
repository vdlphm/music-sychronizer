const mongoose = require("mongoose");

const baseTrackSchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    artists: [
        {
            name: String
        }
    ]
});

const trackSchema = mongoose.Schema({
    playlistId: {
        type: String,
        required: true
    },
    track: {
        type: baseTrackSchema,
        required: true
    },
    synced: {
        type: Boolean,
        required: true
    }
});

const Track = mongoose.model("Track", trackSchema);

module.exports = {Track};