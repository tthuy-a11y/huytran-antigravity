import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { cvData } from './CVData';

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#1a1a2e',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#00f2fe',
    paddingBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  title: {
    fontSize: 12,
    color: '#e94560',
    fontFamily: 'Courier-Bold',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: 8,
    fontSize: 9,
    color: '#555',
    fontFamily: 'Courier',
    flexWrap: 'wrap',
  },
  contactItem: {
    marginRight: 15,
    marginBottom: 4,
  },
  quote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#e94560',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#0f3460',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 6,
    color: '#333',
  },
  skillCategory: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  skillCategoryTitle: {
    width: '30%',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f3460',
  },
  skillList: {
    width: '70%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    fontSize: 9,
    fontFamily: 'Courier',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 6,
    marginBottom: 6,
    color: '#0f3460',
  },
  experienceBlock: {
    marginBottom: 15,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f3460',
  },
  expDate: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: '#888',
  },
  expRole: {
    fontSize: 10,
    color: '#e94560',
    fontFamily: 'Courier',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: '#00f2fe',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#aaa',
    fontSize: 8,
    fontFamily: 'Courier',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 5,
  }
});

export const CVDocument = () => (
  <Document
    title={`${cvData.header.name} - CV`}
    author={cvData.header.name}
    subject="Frontend Developer CV"
    creator="Antigravity System"
  >
    <Page size="A4" style={styles.page}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.name}>{cvData.header.name}</Text>
        <Text style={styles.title}>{cvData.header.title}</Text>
        
        <View style={styles.contactRow}>
          <Text style={styles.contactItem}>PHONE: {cvData.contact.phone}</Text>
          <Text style={styles.contactItem}>EMAIL: {cvData.contact.email}</Text>
          <Text style={styles.contactItem}>LOC: {cvData.contact.address}</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactItem}>LINKEDIN: {cvData.contact.linkedin}</Text>
          <Text style={styles.contactItem}>GITHUB: {cvData.contact.github}</Text>
          <Text style={styles.contactItem}>DOB: {cvData.contact.dob}</Text>
        </View>
      </View>

      {/* QUOTE */}
      <Text style={styles.quote}>"{cvData.quote}"</Text>

      {/* SUMMARY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mục Tiêu & Phong Cách</Text>
        {cvData.summary.map((text, i) => (
          <Text key={i} style={styles.text}>{text}</Text>
        ))}
      </View>

      {/* SKILLS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kỹ Năng & Công Nghệ</Text>
        {cvData.skills.map((category, i) => (
          <View key={i} style={styles.skillCategory}>
            <Text style={styles.skillCategoryTitle}>{category.category}</Text>
            <View style={styles.skillList}>
              {category.items.map((skill, j) => (
                <Text key={j} style={styles.skillItem}>{skill}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* EXPERIENCE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dự Án & Kinh Nghiệm</Text>
        {cvData.experience.map((exp, i) => (
          <View key={i} style={styles.experienceBlock}>
            <View style={styles.experienceHeader}>
              <Text style={styles.expTitle}>{exp.title}</Text>
              <Text style={styles.expDate}>{exp.period}</Text>
            </View>
            <Text style={styles.expRole}>{exp.role}</Text>
            {exp.points.map((point, j) => (
              <View key={j} style={styles.bulletPoint}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* EDUCATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Học Vấn</Text>
        <View style={styles.experienceBlock}>
          <View style={styles.experienceHeader}>
            <Text style={styles.expTitle}>{cvData.education.school}</Text>
            <Text style={styles.expDate}>{cvData.education.period}</Text>
          </View>
          <Text style={styles.expRole}>{cvData.education.degree}</Text>
          {cvData.education.points.map((point, j) => (
            <View key={j} style={styles.bulletPoint}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FOOTER */}
      <Text style={styles.footer} fixed>
        Generated dynamically by Antigravity System - {new Date().getFullYear()}
      </Text>

    </Page>
  </Document>
);
