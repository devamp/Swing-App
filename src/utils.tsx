import { type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons/static";
import { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { User } from './types';
import Theme from './theme';

export type SectionProps = {
  title: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  optional?: boolean;
  headerAction?: ReactNode;
  children?: ReactNode;
};

export function Section({ title, icon, optional = false, headerAction, children }: SectionProps) {
  return (
    <View style={sectionStyles.section}>
      <View style={sectionStyles.sectionHeaderRow}>
        <MaterialCommunityIcons name={icon} size={22} color={Theme.PRIMARY} />
        <Text style={sectionStyles.sectionTitle}>{title}</Text>
        {optional ? <Text style={sectionStyles.optionalText}>Optional</Text> : null}
        {headerAction ? (
          <View style={sectionStyles.sectionHeaderAction}>{headerAction}</View>
        ) : null}
      </View>
      {children ? <View style={sectionStyles.chipRow}>{children}</View> : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  section: {
    gap: 11,
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    flexShrink: 1,
    color: Theme.PRIMARY,
    fontSize: 22,
    fontWeight: '700',
  },
  sectionHeaderAction: {
    marginLeft: 'auto',
  },
  optionalText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  chipRow: {
    width: '100%',
    gap: 10,
  },
});

export function getPlayerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join('');
}
