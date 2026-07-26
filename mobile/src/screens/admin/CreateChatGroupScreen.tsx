import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppButton,
  AppHeader,
  AppInput,
  ErrorMessage,
  LoadingIndicator,
} from '../../components';
import { UPLOADS_BASE_URL } from '../../constants/config';
import { theme } from '../../constants/theme';
import { chatApi } from '../../api/chatApi';
import { useFabricSafeBack } from '../../navigation/safeStackBack';
import { getErrorMessage } from '../../utils/errors';
import type { User } from '../../types';
import type { ChatStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ChatStackParamList, 'CreateChatGroup'>;

export default function CreateChatGroupScreen({ route }: Props) {
  const groupId = route.params?.groupId;
  const isEdit = !!groupId;
  const [name, setName] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [photo, setPhoto] = useState<{ uri: string; type?: string; name?: string } | undefined>();
  const [existingPhoto, setExistingPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'ChatHub' }],
    delayMs: 280,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const membersResponse = await chatApi.listMembers();
      setMembers(membersResponse.data.members);

      if (groupId) {
        const groupResponse = await chatApi.getGroup(groupId);
        const group = groupResponse.data.group;
        setName(group.name);
        setExistingPhoto(group.photo || '');
        const populatedMembers = group.members as User[];
        setSelectedIds(populatedMembers.map(member => member._id));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return members;
    }
    return members.filter(
      member =>
        member.fullName.toLowerCase().includes(query) ||
        member.employeeId.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query),
    );
  }, [members, search]);

  const toggleMember = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const pickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response: ImagePickerResponse) => {
      const asset = response.assets?.[0];
      if (response.didCancel || !asset?.uri) {
        return;
      }
      setPhoto({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'group-photo.jpg',
      });
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Enter a group name.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Select at least one employee or HR member.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      let photoPath = existingPhoto;
      if (photo) {
        const uploadResponse = await chatApi.uploadAsset(photo);
        photoPath = uploadResponse.data.url;
      }

      const payload = {
        name: name.trim(),
        memberIds: selectedIds,
        ...(photoPath ? { photo: photoPath } : {}),
      };

      if (isEdit && groupId) {
        await chatApi.updateGroup(groupId, payload);
      } else {
        await chatApi.createGroup(payload);
      }

      Alert.alert('Success', isEdit ? 'Group updated successfully' : 'Group created successfully', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const previewUri =
    photo?.uri || (existingPhoto ? `${UPLOADS_BASE_URL}${existingPhoto}` : undefined);

  if (loading) {
    return (
      <View style={styles.container} collapsable={false}>
        <AppHeader
          title={isEdit ? 'Edit Group' : 'Create Group'}
          showBack
          onBack={handleBack}
        />
        <LoadingIndicator fullScreen />
      </View>
    );
  }

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title={isEdit ? 'Edit Group' : 'Create Group'}
        subtitle="Add employees and HR"
        showBack
        onBack={handleBack}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <ErrorMessage message={error} /> : null}

        <Pressable style={styles.photoPicker} onPress={pickPhoto}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.photo} />
          ) : (
            <MaterialCommunityIcons name="camera-plus" size={32} color={theme.colors.primary} />
          )}
          <Text style={styles.photoText}>Group photo (optional)</Text>
        </Pressable>

        <AppInput
          label="Group name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sales Team, HR Updates"
        />

        <AppInput
          label="Search members"
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, ID, department"
        />

        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>{selectedIds.length} selected</Text>
          <Pressable onPress={() => setSelectedIds(members.map(member => member._id))}>
            <Text style={styles.linkText}>Select all</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedIds([])}>
            <Text style={styles.linkText}>Clear</Text>
          </Pressable>
        </View>

        {filteredMembers.length === 0 ? (
          <Text style={styles.emptyMembers}>
            No employees or HR members found. Add staff accounts first.
          </Text>
        ) : (
          filteredMembers.map(item => {
            const selected = selectedIds.includes(item._id);
            return (
              <Pressable
                key={item._id}
                style={[styles.memberRow, selected && styles.memberRowSelected]}
                onPress={() => toggleMember(item._id)}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{item.fullName.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.fullName}</Text>
                  <Text style={styles.memberMeta}>
                    {item.employeeId} • {item.role === 'hr' ? 'HR' : 'Employee'} • {item.department}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={24}
                  color={selected ? theme.colors.primary : theme.colors.textMuted}
                />
              </Pressable>
            );
          })
        )}

        <AppButton
          title={isEdit ? 'Save Group' : 'Create Group'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  photoPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: theme.spacing.sm,
  },
  photoText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  selectedLabel: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.textSecondary,
  },
  linkText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  emptyMembers: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  memberRowSelected: {
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FBFF',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  memberAvatarText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  memberMeta: {
    marginTop: 2,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  submitBtn: {
    marginTop: theme.spacing.lg,
  },
});
