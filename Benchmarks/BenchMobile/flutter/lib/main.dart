import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter - French Economy Open Data',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const DatasetListPage(),
    );
  }
}

class DatasetListPage extends StatefulWidget {
  const DatasetListPage({super.key});

  @override
  State<DatasetListPage> createState() => _DatasetListPageState();
}

class _DatasetListPageState extends State<DatasetListPage> {
  List<dynamic> _datasets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDatasets();
  }

  Future<void> _fetchDatasets() async {
    try {
      final response = await http.get(
        Uri.parse('https://data.economie.gouv.fr/api/explore/v2.0/catalog/datasets'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _datasets = data['datasets'] ?? [];
          _loading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to fetch datasets';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _showDatasetDetails(dynamic dataset) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          child: Container(
            padding: const EdgeInsets.all(24),
            constraints: const BoxConstraints(maxWidth: 600, maxHeight: 600),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dataset['dataset']?['metas']?['default']?['title'] ??
                      dataset['dataset']?['dataset_id'] ?? 'Unknown',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDetailRow(
                          'Dataset ID:',
                          dataset['dataset']?['dataset_id'] ?? 'N/A',
                        ),
                        _buildDetailRow(
                          'Modified:',
                          dataset['dataset']?['metas']?['default']?['modified'] != null
                              ? DateTime.parse(dataset['dataset']['metas']['default']['modified'])
                                  .toLocal()
                                  .toString()
                              : 'N/A',
                        ),
                        _buildDetailRow(
                          'Publisher:',
                          dataset['dataset']?['metas']?['default']?['publisher'] ?? 'N/A',
                        ),
                        _buildDetailRow(
                          'Records:',
                          dataset['dataset']?['metas']?['default']?['records_count']?.toString() ?? 'N/A',
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey[600],
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 40),
                  ),
                  child: const Text('Close'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(fontSize: 14, color: Colors.black87),
          children: [
            TextSpan(
              text: label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            TextSpan(text: ' $value'),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Flutter - French Economy Open Data'),
      ),
      body: _loading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'Loading datasets...',
                    style: TextStyle(color: Colors.black54),
                  ),
                ],
              ),
            )
          : _error != null
              ? Padding(
                  padding: const EdgeInsets.all(20),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Error: $_error',
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'Found ${_datasets.length} datasets',
                        style: const TextStyle(color: Colors.black54),
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _datasets.length,
                        itemBuilder: (context, index) {
                          final dataset = _datasets[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            elevation: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    dataset['dataset']?['dataset_id'] ?? 'Unknown',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  if (dataset['dataset']?['metas']?['default']?['title'] != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      dataset['dataset']['metas']['default']['title'],
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                  if (dataset['dataset']?['metas']?['default']?['description'] != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      dataset['dataset']['metas']['default']['description']
                                          .replaceAll(RegExp(r'<[^>]*>'), ''),
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.black54,
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      if (dataset['dataset']?['metas']?['default']?['modified'] != null)
                                        Expanded(
                                          child: Text(
                                            'Modified: ${DateTime.parse(dataset['dataset']['metas']['default']['modified']).toLocal().toString().split(' ')[0]}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: Colors.black38,
                                            ),
                                          ),
                                        ),
                                      ElevatedButton(
                                        onPressed: () => _showDatasetDetails(dataset),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF1976D2),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                        ),
                                        child: const Text('Details'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }
}
