import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#0a0a0a',
    color: '#e0e0e0',
    fontFamily: 'Helvetica',
    padding: 40,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #22d3ee',
    paddingBottom: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#67e8f9',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#a5f3fc',
    letterSpacing: 3,
  },
  callsign: {
    fontSize: 11,
    color: '#22d3ee',
    marginTop: 4,
  },
  philosophy: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#67e8f9',
    marginTop: 20,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#22d3ee',
    marginBottom: 12,
    borderBottom: '1px solid #22d3ee',
    paddingBottom: 4,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#e0e0e0',
  },
  bullet: {
    marginLeft: 10,
    marginBottom: 6,
  },
});
