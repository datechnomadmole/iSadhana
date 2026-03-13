package com.example.audioscript

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.audioscript.adapters.ScriptAdapter
import com.example.audioscript.models.ScriptItem
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.blacksquircle.ui.editorkit.widget.TextProcessor

class MainActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: ScriptAdapter
    private val scriptList = mutableListOf<ScriptItem>()
    private lateinit var jsonEditor: TextProcessor

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupVisualEditor()
        setupCodeEditor()
    }

    private fun setupVisualEditor() {
        recyclerView = findViewById(R.id.recyclerView)
        adapter = ScriptAdapter(scriptList)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        val itemTouchHelper = ItemTouchHelper(object : ItemTouchHelper.SimpleCallback(
            ItemTouchHelper.UP or ItemTouchHelper.DOWN, 0) {
            override fun onMove(
                rv: RecyclerView, 
                vh: RecyclerView.ViewHolder, 
                target: RecyclerView.ViewHolder
            ): Boolean {
                adapter.onItemMove(vh.adapterPosition, target.adapterPosition)
                return true
            }
            override fun onSwiped(vh: RecyclerView.ViewHolder, dir: Int) {
                // Handle deletion
            }
        })
        itemTouchHelper.attachToRecyclerView(recyclerView)
    }

    private fun setupCodeEditor() {
        jsonEditor = findViewById(R.id.jsonEditor)
        // EditorKit configuration would go here
    }

    // Sync Visual to Code
    private fun syncToCode() {
        val gson = GsonBuilder().setPrettyPrinting().create()
        val jsonString = gson.toJson(scriptList)
        jsonEditor.setTextContent(jsonString)
    }

    // Sync Code to Visual
    private fun syncToVisual() {
        val jsonString = jsonEditor.text.toString()
        val newList = Gson().fromJson(jsonString, Array<ScriptItem>::class.java).toList()
        scriptList.clear()
        scriptList.addAll(newList)
        adapter.notifyDataSetChanged()
    }
}
