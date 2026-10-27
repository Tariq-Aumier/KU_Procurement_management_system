<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    /**
     * Get all backups
     */
    public function index(): JsonResponse
    {
        try {
            // Clean up orphaned backup records (records without files)
            $allBackups = Backup::all();
            foreach ($allBackups as $backup) {
                if (!$backup->getFileExists()) {
                    $backup->delete();
                }
            }

            $backups = Backup::with('createdBy')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($backup) {
                    $backup->file_size = $backup->getHumanFileSize();
                    $backup->file_exists = $backup->getFileExists();
                    return $backup;
                });

            return response()->json([
                'success' => true,
                'data' => $backups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch backups: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new backup
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Generate backup data
            $backupData = $this->generateBackupData();

            // Save JSON backup
            $jsonFileName = 'backup-' . now()->format('Y-m-d-His') . '.json';
            $jsonPath = 'backups/' . $jsonFileName;
            Storage::disk('local')->put($jsonPath, json_encode($backupData, JSON_PRETTY_PRINT));

            // Save backup record using model
            $backup = Backup::create([
                'storage_path' => $jsonPath,
                'checksum' => md5(json_encode($backupData)),
                'status' => 'completed',
                'created_by' => auth()->id() ?? 1,
                'retention_until' => now()->addDays(30),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully',
                'data' => [
                    'id' => $backup->id,
                    'json_file' => $jsonFileName,
                    'file_size' => $backup->getHumanFileSize(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download backup as JSON
     */
    public function downloadJson($id): StreamedResponse
    {
        try {
            $backup = Backup::findOrFail($id);

            if (!$backup->getFileExists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            $file = Storage::disk('local')->get($backup->storage_path);
            $fileName = basename($backup->storage_path);

            return response()->streamDownload(function () use ($file) {
                echo $file;
            }, $fileName, [
                'Content-Type' => 'application/json',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download backup as Excel (CSV format for now)
     */
    public function downloadExcel($id): StreamedResponse
    {
        try {
            $backup = Backup::findOrFail($id);

            if (!$backup->getFileExists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            $jsonContent = Storage::disk('local')->get($backup->storage_path);
            $backupData = json_decode($jsonContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to decode backup JSON: ' . json_last_error_msg()
                ], 500);
            }

            $csvContent = $this->generateCsvFromBackup($backupData);

            $excelFileName = str_replace('.json', '.csv', basename($backup->storage_path));

            return response()->streamDownload(function () use ($csvContent) {
                echo $csvContent;
            }, $excelFileName, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $excelFileName . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download Excel backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a backup
     */
    public function destroy($id): JsonResponse
    {
        try {
            $backup = Backup::findOrFail($id);

            // Delete files
            if (Storage::disk('local')->exists($backup->storage_path)) {
                Storage::disk('local')->delete($backup->storage_path);
            }

            $csvPath = str_replace('.json', '.csv', $backup->storage_path);
            if (Storage::disk('local')->exists($csvPath)) {
                Storage::disk('local')->delete($csvPath);
            }

            // Delete record using model
            $backup->delete();

            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore from backup file
     */
    public function restore(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'backup_file' => 'required|file|mimes:json',
            ]);

            $file = $request->file('backup_file');
            $jsonContent = file_get_contents($file->getPathname());
            $backupData = json_decode($jsonContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid JSON file: ' . json_last_error_msg()
                ], 422);
            }

            if (!isset($backupData['tables']) || !is_array($backupData['tables'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid backup format: missing tables data'
                ], 422);
            }

            // Restore data using DB transaction
            DB::transaction(function () use ($backupData) {
                foreach ($backupData['tables'] as $tableName => $tableData) {
                    if (!isset($tableData['records']) || !is_array($tableData['records'])) {
                        continue;
                    }

                    // Skip migrations table
                    if ($tableName === 'migrations') {
                        continue;
                    }

                    // Clear existing data
                    DB::table($tableName)->truncate();

                    // Insert backup data
                    foreach ($tableData['records'] as $record) {
                        $recordArray = (array) $record;
                        unset($recordArray['id']); // Let database auto-increment
                        DB::table($tableName)->insert($recordArray);
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Backup restored successfully',
                'data' => [
                    'restored_tables' => count($backupData['tables']),
                    'backup_date' => $backupData['backup_date'] ?? 'N/A',
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate backup data from database
     */
    private function generateBackupData(): array
    {
        $data = [];
        
        // Get all tables
        $tables = DB::select("SHOW TABLES");
        $databaseName = DB::getDatabaseName();
        
        foreach ($tables as $table) {
            $tableName = $table->{'Tables_in_' . $databaseName};
            
            // Skip migrations table
            if ($tableName === 'migrations') {
                continue;
            }
            
            $columns = DB::select("SHOW COLUMNS FROM {$tableName}");
            $records = DB::table($tableName)->get()->toArray();
            
            $data[$tableName] = [
                'columns' => $columns,
                'records' => $records,
                'count' => count($records),
            ];
        }
        
        return [
            'backup_date' => now()->toDateTimeString(),
            'database' => $databaseName,
            'tables' => $data,
            'total_tables' => count($data),
        ];
    }

    /**
     * Generate CSV from backup data
     */
    private function generateCsvFromBackup(array $backupData): string
    {
        $csv = "Backup Summary\n";
        $csv .= "Backup Date," . ($backupData['backup_date'] ?? 'N/A') . "\n";
        $csv .= "Database," . ($backupData['database'] ?? 'N/A') . "\n";
        $csv .= "Total Tables," . ($backupData['total_tables'] ?? 0) . "\n\n";
        
        $csv .= "Table Name,Record Count\n";
        if (isset($backupData['tables']) && is_array($backupData['tables'])) {
            foreach ($backupData['tables'] as $tableName => $tableData) {
                $count = is_array($tableData) && isset($tableData['count']) ? $tableData['count'] : 0;
                $csv .= $tableName . "," . $count . "\n";
            }
        }
        
        $csv .= "\n\n";
        
        // Add data for each table
        if (isset($backupData['tables']) && is_array($backupData['tables'])) {
            foreach ($backupData['tables'] as $tableName => $tableData) {
                if (!is_array($tableData) || !isset($tableData['records']) || count($tableData['records']) === 0) {
                    continue;
                }
                
                $csv .= "=== Table: " . $tableName . " ===\n";
                
                // Headers
                $headers = [];
                if (isset($tableData['columns']) && is_array($tableData['columns'])) {
                    foreach ($tableData['columns'] as $column) {
                        if (is_object($column) && isset($column->Field)) {
                            $headers[] = $column->Field;
                        } elseif (is_array($column) && isset($column['Field'])) {
                            $headers[] = $column['Field'];
                        }
                    }
                }
                if (!empty($headers)) {
                    $csv .= implode(',', $headers) . "\n";
                }
                
                // Data
                foreach ($tableData['records'] as $record) {
                    $row = [];
                    if (isset($tableData['columns']) && is_array($tableData['columns'])) {
                        foreach ($tableData['columns'] as $column) {
                            $fieldName = is_object($column) ? ($column->Field ?? null) : ($column['Field'] ?? null);
                            $value = $fieldName !== null ? ($record->$fieldName ?? $record[$fieldName] ?? '') : '';
                            // Escape commas and quotes
                            if (is_object($value) || is_array($value)) {
                                $value = json_encode($value);
                            }
                            $value = str_replace('"', '""', (string)$value);
                            if (strpos($value, ',') !== false || strpos($value, '"') !== false) {
                                $value = '"' . $value . '"';
                            }
                            $row[] = $value;
                        }
                    }
                    $csv .= implode(',', $row) . "\n";
                }
                
                $csv .= "\n\n";
            }
        }
        
        return $csv;
    }
}

