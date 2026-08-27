import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchCamera, type CameraOptions } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ErrorMessage, GeoCamOverlay, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { formatTime } from '../../utils/dates';
import {
  getLocationForGeoCam,
  requestLocationPermission,
} from '../../utils/location';
import type { LocationPayload } from '../../types';
import type { EmployeeReportsStackParamList } from '../../navigation/types';
import { useStackBackTo } from '../../navigation/safeStackBack';

type Props = NativeStackScreenProps<EmployeeReportsStackParamList, 'HourlyReportForm'>;

const cameraOptions: CameraOptions = {
  mediaType: 'photo',
  cameraType: 'back',
  quality: 0.9,
  saveToPhotos: false,
  includeExtra: true,
};

export default function HourlyReportFormScreen({ route, navigation }: Props) {
  const isFieldEmployee = useAuthStore(state => state.user?.isFieldEmployee === true);
  const periodStart = route.params?.periodStart;
  const periodEnd = route.params?.periodEnd ?? new Date().toISOString();
  const [workSummary, setWorkSummary] = useState('');
  const [location, setLocation] = useState<LocationPayload | null>(null);
  const [photo, setPhoto] = useState<{ uri: string; type?: string; name?: string } | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');

  const { handleBack } = useStackBackTo('WorkReportList');

  const refreshLocation = useCallback(async () => {
    setLoadingLocation(true);
    setError('');
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        throw new Error('Location permission is required for GeoCam hourly reports.');
      }
      const point = await getLocationForGeoCam({ showAlerts: false });
      if (!point) {
        throw new Error('Could not detect your current location. Turn on GPS and tap to refresh.');
      }
      setLocation(point);
    } catch (err) {
      setLocation(null);
      setError(getErrorMessage(err));
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (!isFieldEmployee) {
      return;
    }
    void refreshLocation();
  }, [isFieldEmployee, refreshLocation]);

  const periodLabel = `${formatTime(periodStart ? new Date(periodStart) : new Date(periodEnd))} - ${formatTime(new Date(periodEnd))}`;

  const handleCapturePhoto = async () => {
    if (!location) {
      setError('Wait for your location before capturing the GeoCam photo.');
      return;
    }

    setCapturing(true);
    setError('');
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        throw new Error('Camera and location permissions are required.');
      }

      const point = await getLocationForGeoCam({ showAlerts: false });
      if (!point) {
        throw new Error('Could not refresh GPS location for this photo.');
      }
      setLocation(point);

      const response = await launchCamera(cameraOptions);
      if (response.didCancel) {
        return;
      }
      if (response.errorMessage) {
        throw new Error(response.errorMessage);
      }

      const asset = response.assets?.[0];
      if (!asset?.uri) {
        throw new Error('No photo was captured. Please try again.');
      }

      setPhoto({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `geocam-${Date.now()}.jpg`,
      });
      setCapturedAt(new Date().toISOString());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      setError('Location is required for GeoCam hourly reports.');
      return;
    }
    if (!photo) {
      setError('Capture a GeoCam photo with your current location first.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await workReportApi.createHourly(
        {
          workSummary: workSummary.trim() || 'Field hourly GeoCam report',
          reportPeriodStart: periodStart,
          reportPeriodEnd: periodEnd,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          accuracy: location.accuracy,
          capturedAt: capturedAt || new Date().toISOString(),
        },
        photo,
      );
      Alert.alert(
        'GeoCam Report Sent',
        'Your hourly photo report with location has been sent to Admin and HR.',
        [{ text: 'OK', onPress: () => navigation.navigate('WorkReportList', { reportKind: 'hourly' }) }],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isFieldEmployee) {
    return (
      <View style={styles.container}>
        <AppHeader title="Hourly Report" showBack onBack={handleBack} />
        <View style={styles.center}>
          <MaterialCommunityIcons name="camera-off-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.restrictedTitle}>Field employees only</Text>
          <Text style={styles.restrictedText}>
            Hourly GeoCam reports are only available for field sales employees.
          </Text>
          <AppButton title="Back to Reports" onPress={handleBack} style={styles.backButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="GeoCam Hourly Report" showBack onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Report Period</Text>
            <Text style={styles.infoText}>{periodLabel}</Text>
            <Text style={styles.infoHint}>
              Capture a live photo with your current location stamped on it, like a GeoCam app.
            </Text>
          </View>

          {loadingLocation ? (
            <View style={styles.loadingCard}>
              <LoadingIndicator />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : location ? (
            <GeoCamOverlay
              location={location}
              capturedAt={capturedAt || undefined}
              onRefresh={() => void refreshLocation()}
              refreshing={loadingLocation}
            />
          ) : (
            <View style={styles.loadingCard}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={36} color={theme.colors.error} />
              <Text style={styles.locationErrorTitle}>Location not detected</Text>
              <Text style={styles.locationErrorText}>
                Turn on GPS and Precise location, then tap below to try again.
              </Text>
              <AppButton title="Refresh Location" onPress={() => void refreshLocation()} />
            </View>
          )}

          <View style={styles.cameraCard}>
            {photo ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: photo.uri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                  {location ? (
                    <GeoCamOverlay
                      location={location}
                      capturedAt={capturedAt || undefined}
                      compact
                    />
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={styles.cameraPlaceholder}>
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={42}
                  color={theme.colors.primary}
                />
                <Text style={styles.cameraTitle}>GeoCam photo required</Text>
                <Text style={styles.cameraHint}>
                  Open the camera and capture your work site. Location will be stamped on the photo.
                </Text>
              </View>
            )}

            <View style={styles.cameraActions}>
              <AppButton
                title={capturing ? 'Opening Camera...' : photo ? 'Retake GeoCam Photo' : 'Open GeoCam Camera'}
                onPress={handleCapturePhoto}
                loading={capturing}
                disabled={capturing || loadingLocation || submitting}
              />
            </View>
          </View>

          <AppInput
            label="Work Notes (optional)"
            value={workSummary}
            onChangeText={setWorkSummary}
            multiline
            numberOfLines={4}
            placeholder="Add a short note about what you completed this hour..."
            style={styles.summaryInput}
          />

          {error ? <ErrorMessage message={error} /> : null}

          <AppButton
            title={submitting ? 'Sending GeoCam Report...' : 'Send GeoCam Report'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !photo || !location}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  restrictedTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  restrictedText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'stretch',
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  infoHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  loadingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  locationErrorTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  locationErrorText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cameraPlaceholder: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  cameraTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  cameraHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  previewWrap: {
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: 320,
  },
  previewOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraActions: {
    padding: theme.spacing.md,
  },
  summaryInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
});
