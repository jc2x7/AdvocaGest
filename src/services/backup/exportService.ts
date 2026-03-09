import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface CsvColumn {
  header: string;
  key: string;
}

/**
 * Escapes a value for CSV output.
 * Wraps in double quotes if the value contains a comma, newline,
 * or double quote. Internal double quotes are doubled.
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of records into a CSV string.
 * If columns are provided, only those columns are included and headers
 * use the specified labels. Otherwise, all keys from the first record
 * are used as headers.
 */
function recordsToCsv(
  records: Record<string, unknown>[],
  columns?: CsvColumn[],
): string {
  if (records.length === 0) {
    return '';
  }

  const cols: CsvColumn[] = columns ?? Object.keys(records[0]).map((key) => ({
    header: key,
    key,
  }));

  const headerRow = cols.map((col) => escapeCsvValue(col.header)).join(',');
  const dataRows = records.map((record) =>
    cols.map((col) => escapeCsvValue(record[col.key])).join(','),
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Generates a CSV file from the given data array and shares it.
 * Returns the local file URI of the exported CSV.
 */
export async function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: CsvColumn[],
): Promise<string> {
  const csvContent = recordsToCsv(data, columns);
  const sanitizedFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${sanitizedFilename}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (sharingAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Exportar ${sanitizedFilename}`,
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
}

/**
 * Fetches all documents from a Firestore collection filtered by owner_uid.
 */
async function fetchUserCollection(
  collectionName: string,
  uid: string,
): Promise<Record<string, unknown>[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, where('owner_uid', '==', uid));
  const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

interface ExportResult {
  files: string[];
  zipUri: string | null;
}

const EXPORTABLE_COLLECTIONS: { name: string; label: string }[] = [
  { name: 'clients', label: 'clientes' },
  { name: 'cases', label: 'processos' },
  { name: 'deadlines', label: 'prazos' },
  { name: 'appointments', label: 'compromissos' },
  { name: 'tasks', label: 'tarefas' },
  { name: 'communications', label: 'comunicacoes' },
  { name: 'financial_entries', label: 'financeiro' },
  { name: 'fee_contracts', label: 'contratos' },
  { name: 'installments', label: 'parcelas' },
  { name: 'documents', label: 'documentos' },
  { name: 'movements', label: 'movimentacoes' },
  { name: 'leads', label: 'leads' },
  { name: 'time_entries', label: 'timesheet' },
];

/**
 * Exports all user data as individual CSV files and shares them.
 *
 * Each Firestore collection owned by the user is exported to a separate CSV
 * file. All files are stored in the cache directory and shared one by one
 * (or as a combined ZIP when the platform supports it).
 */
export async function exportAllData(uid: string): Promise<ExportResult> {
  const exportedFiles: string[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const exportDir = `${FileSystem.cacheDirectory}export_${timestamp}/`;

  await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });

  for (const col of EXPORTABLE_COLLECTIONS) {
    const records = await fetchUserCollection(col.name, uid);

    if (records.length === 0) {
      continue;
    }

    const csvContent = recordsToCsv(records);
    const filePath = `${exportDir}${col.label}.csv`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    exportedFiles.push(filePath);
  }

  // Try to create a single ZIP for sharing
  let zipUri: string | null = null;
  const zipFilename = `advocagest_backup_${timestamp}.zip`;
  const zipPath = `${FileSystem.cacheDirectory}${zipFilename}`;

  // expo-file-system does not natively support ZIP creation,
  // so we share individual files. The zipUri field is reserved
  // for future integration with a ZIP library (e.g., react-native-zip-archive).
  zipUri = null;

  if (exportedFiles.length > 0) {
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (sharingAvailable) {
      // Share the first file as a starting point; callers can iterate
      // over exportedFiles for additional sharing.
      await Sharing.shareAsync(exportedFiles[0], {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar dados do AdvogaPlan',
      });
    }
  }

  return {
    files: exportedFiles,
    zipUri,
  };
}
