package com.example.audioscript.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.audioscript.R
import com.example.audioscript.models.ScriptItem
import java.util.Collections

class ScriptAdapter(private val scriptList: MutableList<ScriptItem>) : 
    RecyclerView.Adapter<ScriptAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView = view.findViewById(R.id.itemTitle)
        val subtitle: TextView = view.findViewById(R.id.itemSubtitle)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_script, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = scriptList[position]
        if (item.type == "audio") {
            holder.title.text = item.fileName ?: "Select Audio..."
            holder.subtitle.text = "Audio Clip"
        } else {
            holder.title.text = "${item.duration}s Pause"
            holder.subtitle.text = "Silence"
        }
    }

    override fun getItemCount() = scriptList.size

    fun onItemMove(fromPosition: Int, toPosition: Int) {
        if (fromPosition < toPosition) {
            for (i in fromPosition until toPosition) {
                Collections.swap(scriptList, i, i + 1)
            }
        } else {
            for (i in fromPosition downTo toPosition + 1) {
                Collections.swap(scriptList, i, i - 1)
            }
        }
        notifyItemMoved(fromPosition, toPosition)
    }
}
