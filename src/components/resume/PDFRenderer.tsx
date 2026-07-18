import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/hooks/useResume';

// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'
// });

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  contactLine: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10, color: '#4b5563', fontSize: 10 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', borderBottom: '1pt solid #ccc', paddingBottom: 3, marginBottom: 8, textTransform: 'uppercase' },
  item: { marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemTitle: { fontWeight: 'bold' },
  itemSubtitle: { fontStyle: 'italic', color: '#374151' },
  itemDate: { color: '#6b7280', fontSize: 10 },
  bullet: { flexDirection: 'row', marginBottom: 2, paddingLeft: 10 },
  bulletPoint: { width: 10, fontSize: 10 },
  bulletText: { flex: 1 },
  summary: { lineHeight: 1.4, marginBottom: 15 }
});

interface Props {
  resume: ResumeData;
}

export const ResumePDF = ({ resume }: Props) => {
  const { personalInfo, sectionOrder } = resume;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo?.fullName || "Your Name"}</Text>
          <View style={styles.contactLine}>
            {personalInfo?.email && <Text>{personalInfo.email}</Text>}
            {personalInfo?.phone && <Text>{personalInfo.phone}</Text>}
            {personalInfo?.location && <Text>{personalInfo.location}</Text>}
            {personalInfo?.linkedIn && <Text>{personalInfo.linkedIn}</Text>}
          </View>
        </View>

        {sectionOrder?.map(sectionKey => {
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
                    <Text><Text style={{fontWeight: 'bold'}}>{skillGroup.category}:</Text> {skillGroup.items?.join(', ')}</Text>
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
