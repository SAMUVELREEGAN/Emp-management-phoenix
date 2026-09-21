import { TurboModuleRegistry } from 'react-native';
import DocumentPicker, { isCancel, isInProgress, types } from 'react-native-document-picker';

const DOCUMENT_PICKER_UNAVAILABLE =
  'Document picker is not in this app build. Stop Metro, then from the mobile folder run: npm run android (full reinstall on the device).';

export function isChatDocumentPickerAvailable(): boolean {
  return TurboModuleRegistry.get('RNDocumentPicker') != null;
}

export type PickedChatFile = {
  uri: string;
  type: string;
  name: string;
};

const DOCUMENT_TYPES = [
  types.pdf,
  types.doc,
  types.docx,
  types.xls,
  types.xlsx,
  types.ppt,
  types.pptx,
  types.plainText,
  types.csv,
  types.zip,
];

export async function pickChatDocument(): Promise<PickedChatFile | null> {
  if (!isChatDocumentPickerAvailable()) {
    throw new Error(DOCUMENT_PICKER_UNAVAILABLE);
  }

  try {
    const [file] = await DocumentPicker.pick({
      type: DOCUMENT_TYPES,
      copyTo: 'cachesDirectory',
      allowMultiSelection: false,
    });

    const uri = file.fileCopyUri || file.uri;
    if (!uri) {
      throw new Error(
        file.copyError || 'Could not read this file. Try saving it locally and pick again.',
      );
    }

    return {
      uri,
      type: file.type || guessMimeFromName(file.name),
      name: file.name || 'document',
    };
  } catch (err) {
    if (isCancel(err) || isInProgress(err)) {
      return null;
    }
    throw err;
  }
}

function guessMimeFromName(name: string | null): string {
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (lower.endsWith('.doc')) {
    return 'application/msword';
  }
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lower.endsWith('.xls')) {
    return 'application/vnd.ms-excel';
  }
  if (lower.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  return 'application/octet-stream';
}
