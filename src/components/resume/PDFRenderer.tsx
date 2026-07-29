import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/hooks/useResume';

// Define styles for different templates
const classicStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Times-Roman' },
  header: { marginBottom: 20, textAlign: 'center', borderBottom: '2pt solid #000', paddingBottom: 10 },
  name: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  contactLine: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 15, color: '#000', fontSize: 10 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', borderBottom: '1pt solid #000', paddingBottom: 2, marginBottom: 8, textTransform: 'uppercase' },
  item: { marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemTitle: { fontWeight: 'bold', fontSize: 12 },
  itemSubtitle: { fontStyle: 'italic', color: '#000' },
  itemDate: { color: '#000', fontSize: 11 },
  bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 15 },
  bulletPoint: { width: 12, fontSize: 11 },
  bulletText: { flex: 1, lineHeight: 1.3 },
  summary: { lineHeight: 1.4, marginBottom: 15 }
});

const modernStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 25, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1pt solid #e5e7eb', paddingBottom: 15 },
  name: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  contactLine: { flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: '#4b5563', fontSize: 9 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#2563eb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  item: { marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemTitle: { fontWeight: 'bold', color: '#111827', fontSize: 11 },
  itemSubtitle: { color: '#4b5563', fontWeight: 'bold' },
  itemDate: { color: '#6b7280', fontSize: 9 },
  bullet: { flexDirection: 'row', marginBottom: 4, paddingLeft: 10 },
  bulletPoint: { width: 10, fontSize: 10, color: '#2563eb' },
  bulletText: { flex: 1, color: '#374151', lineHeight: 1.4 },
  summary: { lineHeight: 1.5, marginBottom: 20, color: '#374151' }
});

const minimalistStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 30 },
  name: { fontSize: 24, fontWeight: 'light', marginBottom: 10, color: '#333' },
  contactLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, color: '#666', fontSize: 9 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, color: '#999', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2 },
  item: { marginBottom: 15 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemTitle: { fontWeight: 'bold', color: '#333' },
  itemSubtitle: { color: '#666' },
  itemDate: { color: '#999', fontSize: 9 },
  bullet: { flexDirection: 'row', marginBottom: 4, paddingLeft: 5 },
  bulletPoint: { width: 8, fontSize: 10, color: '#999' },
  bulletText: { flex: 1, color: '#444', lineHeight: 1.5 },
  summary: { lineHeight: 1.6, marginBottom: 25, color: '#444' }
});

interface Props {
  resume: ResumeData;
}

export const ResumePDF = ({ resume }: Props) => {
  const { personalInfo, sectionOrder, template } = resume;
  
  let styles = modernStyles;
  if (template === 'classic') styles = classicStyles;
  if (template === 'minimalist') styles = minimalistStyles;

  // Fallback order if empty
  const order = sectionOrder?.length ? sectionOrder : [
    'professionalSummary', 'experience', 'education', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'links'
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{personalInfo?.fullName || "Your Name"}</Text>
          </View>
          <View style={styles.contactLine}>
            {personalInfo?.email && <Text>{personalInfo.email}</Text>}
            {personalInfo?.phone && <Text>{personalInfo.phone}</Text>}
            {personalInfo?.location && <Text>{personalInfo.location}</Text>}
            {personalInfo?.linkedIn && <Text>{personalInfo.linkedIn}</Text>}
            {personalInfo?.github && <Text>{personalInfo.github}</Text>}
            {personalInfo?.portfolioUrl && <Text>{personalInfo.portfolioUrl}</Text>}
          </View>
        </View>

        {order.map(sectionKey => {
          if (sectionKey === 'professionalSummary' && personalInfo?.professionalSummary) {
            return (
              <View style={styles.summary} key={sectionKey}>
                <Text>{personalInfo.professionalSummary}</Text>
              </View>
            );
          }

          if (sectionKey === 'experience' && resume.experience?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {resume.experience.map((exp, i) => (
                  <View style={styles.item} key={i}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemDate}>{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</Text>
                    </View>
                    <Text style={styles.itemSubtitle}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</Text>
                    {exp.bulletPoints?.map((bp: string, j: number) => (
                      <View style={styles.bullet} key={j}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{bp}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          }

          if (sectionKey === 'education' && resume.education?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Education</Text>
                {resume.education.map((edu, i) => (
                  <View style={styles.item} key={i}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{edu.institution}</Text>
                      <Text style={styles.itemDate}>{edu.startDate} - {edu.endDate}</Text>
                    </View>
                    <Text style={styles.itemSubtitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                    {edu.gpa && <Text style={styles.bulletText}>GPA: {edu.gpa}</Text>}
                  </View>
                ))}
              </View>
            );
          }
          
          if (sectionKey === 'projects' && resume.projects?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {resume.projects.map((proj, i) => (
                  <View style={styles.item} key={i}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{proj.name}</Text>
                    </View>
                    {proj.description && <Text style={styles.itemSubtitle}>{proj.description}</Text>}
                    {proj.bulletPoints?.map((bp: string, j: number) => (
                      <View style={styles.bullet} key={j}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{bp}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          }
          
          if (sectionKey === 'skills' && resume.skills?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {resume.skills.map((skillGroup, i) => (
                  <View style={styles.item} key={i}>
                    <Text><Text style={{fontWeight: 'bold'}}>{skillGroup.category}:</Text> {(skillGroup.items || []).join(', ')}</Text>
                  </View>
                ))}
              </View>
            );
          }

          if (sectionKey === 'certifications' && resume.certifications?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {resume.certifications.map((cert, i) => (
                  <View style={styles.item} key={i}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{cert.name}</Text>
                      <Text style={styles.itemDate}>{cert.issueDate}</Text>
                    </View>
                    <Text style={styles.itemSubtitle}>{cert.issuer}</Text>
                  </View>
                ))}
              </View>
            );
          }

          if (sectionKey === 'achievements' && resume.achievements?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                {resume.achievements.map((ach, i) => (
                  <View style={styles.item} key={i}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{ach.title}</Text>
                      <Text style={styles.itemDate}>{ach.date}</Text>
                    </View>
                    <Text style={styles.bulletText}>{ach.description}</Text>
                  </View>
                ))}
              </View>
            );
          }

          if (sectionKey === 'languages' && resume.languages?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {resume.languages.map((lang, i) => (
                  <View style={styles.item} key={i}>
                    <Text><Text style={{fontWeight: 'bold'}}>{lang.name}:</Text> {lang.proficiency}</Text>
                  </View>
                ))}
              </View>
            );
          }

          if (sectionKey === 'links' && resume.links?.length > 0) {
            return (
              <View style={styles.section} key={sectionKey}>
                <Text style={styles.sectionTitle}>Links</Text>
                {resume.links.map((link, i) => (
                  <View style={styles.item} key={i}>
                    <Text><Text style={{fontWeight: 'bold'}}>{link.label}:</Text> {link.url}</Text>
                  </View>
                ))}
              </View>
            );
          }

          return null;
        })}
      </Page>
    </Document>
  );
};
