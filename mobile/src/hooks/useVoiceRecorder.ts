import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  type RecordBackType,
} from 'react-native-audio-recorder-player';

const androidAudioSet = {
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSamplingRateAndroid: 44100,
  AudioEncodingBitRateAndroid: 128000,
  AudioChannelsAndroid: 1,
};

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function normalizeFileUri(uri: string): string {
  if (!uri) {
    return uri;
  }
  if (uri.startsWith('file://') || uri.startsWith('http')) {
    return uri;
  }
  return `file://${uri}`;
}

export function useVoiceRecorder() {
  const audioRecorderPlayer = useMemo(() => new AudioRecorderPlayer(), []);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordPathRef = useRef('');
  const durationMsRef = useRef(0);
  const recordingRef = useRef(false);

  const cleanup = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await audioRecorderPlayer.stopRecorder();
      }
    } catch {
      // ignore teardown errors
    }
    try {
      await audioRecorderPlayer.stopPlayer();
    } catch {
      // ignore teardown errors
    }
    audioRecorderPlayer.removeRecordBackListener();
    audioRecorderPlayer.removePlayBackListener();
    recordingRef.current = false;
    recordPathRef.current = '';
    durationMsRef.current = 0;
    setIsRecording(false);
    setRecordDuration(0);
  }, [audioRecorderPlayer]);

  useEffect(() => {
    void audioRecorderPlayer.setSubscriptionDuration(0.2);
    return () => {
      void cleanup();
    };
  }, [audioRecorderPlayer, cleanup]);

  const startRecording = useCallback(async () => {
    const allowed = await requestMicPermission();
    if (!allowed) {
      throw new Error('Microphone permission is required for voice messages.');
    }

    await cleanup();

    const path =
      Platform.OS === 'android'
        ? `${RNFS.CachesDirectoryPath}/voice-${Date.now()}.m4a`
        : 'DEFAULT';

    const uri = await audioRecorderPlayer.startRecorder(
      path,
      Platform.OS === 'android' ? androidAudioSet : undefined,
    );
    recordingRef.current = true;
    durationMsRef.current = 0;
    audioRecorderPlayer.addRecordBackListener((meta: RecordBackType) => {
      durationMsRef.current = meta.currentPosition;
      setRecordDuration(Math.max(0, Math.floor(meta.currentPosition / 1000)));
    });
    recordPathRef.current = normalizeFileUri(uri);
    setIsRecording(true);
    setRecordDuration(0);
  }, [audioRecorderPlayer, cleanup]);

  const stopRecording = useCallback(async () => {
    const uri = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    recordingRef.current = false;
    setIsRecording(false);

    const finalUri = normalizeFileUri(uri || recordPathRef.current);
    const durationSeconds = Math.max(1, Math.ceil(durationMsRef.current / 1000));

    recordPathRef.current = '';
    durationMsRef.current = 0;
    setRecordDuration(0);

    return {
      uri: finalUri,
      duration: durationSeconds,
      type: Platform.OS === 'android' ? 'audio/mp4' : 'audio/m4a',
      name: `voice-${Date.now()}.m4a`,
    };
  }, [audioRecorderPlayer]);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) {
      return;
    }
    await cleanup();
  }, [cleanup]);

  const playVoice = useCallback(
    async (uri: string) => {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      await audioRecorderPlayer.startPlayer(uri);
      audioRecorderPlayer.addPlayBackListener(meta => {
        if (meta.isFinished || (meta.duration > 0 && meta.currentPosition >= meta.duration)) {
          void audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
        }
      });
    },
    [audioRecorderPlayer],
  );

  const stopPlayback = useCallback(async () => {
    await audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
  }, [audioRecorderPlayer]);

  return {
    isRecording,
    recordDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    playVoice,
    stopPlayback,
    cleanup,
  };
}
