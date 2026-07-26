import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

export async function saveAndShareBase64File(
  base64: string,
  filename: string,
  mimeType: string,
) {
  const path = `${RNFS.CachesDirectoryPath}/${filename}`;
  await RNFS.writeFile(path, base64, 'base64');
  await Share.open({
    url: Platform.OS === 'android' ? `file://${path}` : path,
    type: mimeType,
    filename,
    failOnCancel: false,
  });
}
