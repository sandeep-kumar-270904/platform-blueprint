import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { CoverLetter } from '@/hooks/useResume';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 11, lineHeight: 1.5, color: '#333' },
  header: { marginBottom: 30 },
  name: { fontSize: 24, fontWeight: 700, marginBottom: 5 },
  contact: { fontSize: 10, color: '#666' },
  date: { marginBottom: 20 },
  recipient: { marginBottom: 20 },
  body: { marginBottom: 30, textAlign: 'justify' },
  paragraph: { marginBottom: 10 },
  signature: { marginTop: 30 }
});

interface Props {
  letter: CoverLetter;
  userName?: string;
  userEmail?: string;
}

export const CoverLetterPDF = ({ letter, userName, userEmail }: Props) => {
  const paragraphs = letter.content.split('\n').filter(p => p.trim() !== '');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{userName || 'Applicant'}</Text>
          <Text style={styles.contact}>{userEmail || ''}</Text>
        </View>

        <View style={styles.date}>
          <Text>{new Date(letter.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        {(letter.companyName || letter.jobTitle) && (
          <View style={styles.recipient}>
            <Text>Hiring Manager</Text>
            {letter.companyName && <Text>{letter.companyName}</Text>}
            {letter.jobTitle && <Text>Re: {letter.jobTitle} position</Text>}
          </View>
        )}

        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>{p}</Text>
          ))}
        </View>

        <View style={styles.signature}>
          <Text>Sincerely,</Text>
          <Text style={{ marginTop: 20, fontWeight: 700 }}>{userName || 'Applicant'}</Text>
        </View>
      </Page>
    </Document>
  );
};
