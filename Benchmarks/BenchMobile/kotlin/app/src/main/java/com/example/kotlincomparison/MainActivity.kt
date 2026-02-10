package com.example.kotlincomparison

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

data class Dataset(
    val datasetId: String,
    val title: String?,
    val description: String?,
    val modified: String?,
    val publisher: String?,
    val recordsCount: Int?
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    DatasetScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DatasetScreen() {
    var datasets by remember { mutableStateOf<List<Dataset>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var selectedDataset by remember { mutableStateOf<Dataset?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    val url = URL("https://data.economie.gouv.fr/api/explore/v2.0/catalog/datasets")
                    val json = url.readText()
                    val jsonObject = JSONObject(json)
                    val datasetsArray = jsonObject.getJSONArray("datasets")

                    (0 until datasetsArray.length()).map { i ->
                        val item = datasetsArray.getJSONObject(i)
                        val dataset = item.optJSONObject("dataset")
                        val metas = dataset?.optJSONObject("metas")
                        val defaultMeta = metas?.optJSONObject("default")

                        Dataset(
                            datasetId = dataset?.optString("dataset_id") ?: "Unknown",
                            title = defaultMeta?.optString("title"),
                            description = defaultMeta?.optString("description"),
                            modified = defaultMeta?.optString("modified"),
                            publisher = defaultMeta?.optString("publisher"),
                            recordsCount = defaultMeta?.optInt("records_count")
                        )
                    }
                }
                datasets = result
                loading = false
            } catch (e: Exception) {
                error = e.message
                loading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kotlin - French Economy Open Data") }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when {
                loading -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Loading datasets...", color = Color.Gray)
                    }
                }
                error != null -> {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE))
                    ) {
                        Text(
                            text = "Error: $error",
                            color = Color(0xFFD32F2F),
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
                else -> {
                    Column {
                        Text(
                            text = "Found ${datasets.size} datasets",
                            modifier = Modifier.padding(16.dp),
                            color = Color.Gray
                        )
                        LazyColumn(
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(datasets) { dataset ->
                                DatasetCard(
                                    dataset = dataset,
                                    onClick = { selectedDataset = dataset }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    selectedDataset?.let { dataset ->
        DatasetDetailDialog(
            dataset = dataset,
            onDismiss = { selectedDataset = null }
        )
    }
}

@Composable
fun DatasetCard(dataset: Dataset, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = dataset.datasetId,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF333333)
            )
            dataset.title?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = it,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            dataset.description?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = it.replace(Regex("<[^>]*>"), ""),
                    fontSize = 14.sp,
                    color = Color.Gray,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                    lineHeight = 20.sp
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                dataset.modified?.let { modified ->
                    Text(
                        text = "Modified: ${formatDate(modified)}",
                        fontSize = 12.sp,
                        color = Color(0xFF888888),
                        modifier = Modifier.weight(1f)
                    )
                }
                Button(
                    onClick = onClick,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1976D2))
                ) {
                    Text("Details")
                }
            }
        }
    }
}

@Composable
fun DatasetDetailDialog(dataset: Dataset, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 600.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = dataset.title ?: dataset.datasetId,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(16.dp))

                Column(modifier = Modifier.weight(1f, fill = false)) {
                    DetailRow("Dataset ID:", dataset.datasetId)
                    DetailRow(
                        "Modified:",
                        dataset.modified?.let { formatDateTime(it) } ?: "N/A"
                    )
                    DetailRow("Publisher:", dataset.publisher ?: "N/A")
                    DetailRow("Records:", dataset.recordsCount?.toString() ?: "N/A")
                }

                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF666666))
                ) {
                    Text("Close")
                }
            }
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Text(
        text = buildAnnotatedString {
            withStyle(style = SpanStyle(fontWeight = FontWeight.Bold)) {
                append(label)
            }
            append(" $value")
        },
        fontSize = 14.sp,
        color = Color(0xFF666666),
        modifier = Modifier.padding(bottom = 8.dp)
    )
}

fun formatDate(dateString: String): String {
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val date = parser.parse(dateString)
        date?.let { formatter.format(it) } ?: dateString
    } catch (e: Exception) {
        dateString
    }
}

fun formatDateTime(dateString: String): String {
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val date = parser.parse(dateString)
        date?.let { formatter.format(it) } ?: dateString
    } catch (e: Exception) {
        dateString
    }
}
