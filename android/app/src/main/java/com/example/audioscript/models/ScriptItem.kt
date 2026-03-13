package com.example.audioscript

import android.net.Uri

data class ScriptItem(
    val id: String,
    val type: String, // "audio" or "pause"
    var fileName: String? = null,
    var duration: Double? = null, // in seconds
    var uri: Uri? = null // Resolved URI for playback
)
