import { jsPDF } from "jspdf";
import { Note, FlashcardDeck, Subject } from "../types";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-]/gi, "_").toLowerCase() || "study_material";
}

function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportService = {
  // Export single Note as Markdown
  exportNoteToMarkdown: (note: Note, subjectName?: string) => {
    const dateStr = note.updatedDate || new Date().toISOString().split("T")[0];
    const tagsStr = note.tags && note.tags.length > 0 ? note.tags.map((t) => `#${t}`).join(" ") : "None";

    let md = `# ${note.title}\n\n`;
    md += `- **Subject:** ${subjectName || "General"}\n`;
    md += `- **Last Updated:** ${dateStr}\n`;
    md += `- **Tags:** ${tagsStr}\n\n`;

    if (note.summary) {
      md += `> **AI Executive Summary:**\n> ${note.summary.replace(/\n/g, "\n> ")}\n\n`;
    }

    md += `## Content\n\n${note.content}\n`;

    downloadFile(`${sanitizeFilename(note.title)}.md`, md, "text/markdown;charset=utf-8;");
  },

  // Export multiple Notes as Markdown Digest
  exportAllNotesToMarkdown: (notes: Note[], subjects: Subject[], title = "Study Notes Compilation") => {
    let md = `# ${title}\n\n`;
    md += `*Generated on ${new Date().toLocaleDateString()} — Total Notes: ${notes.length}*\n\n`;
    md += `---\n\n`;

    notes.forEach((note, index) => {
      const subject = subjects.find((s) => s.id === note.subjectId)?.name || "General";
      md += `## ${index + 1}. ${note.title}\n\n`;
      md += `**Subject:** ${subject} | **Date:** ${note.updatedDate || "N/A"}\n\n`;

      if (note.summary) {
        md += `> **AI Summary:** ${note.summary}\n\n`;
      }

      md += `${note.content}\n\n`;
      md += `---\n\n`;
    });

    downloadFile(`${sanitizeFilename(title)}.md`, md, "text/markdown;charset=utf-8;");
  },

  // Export Flashcard Deck as Markdown
  exportDeckToMarkdown: (deck: FlashcardDeck, subjectName?: string) => {
    let md = `# Flashcard Deck: ${deck.title}\n\n`;
    md += `- **Subject:** ${subjectName || "General"}\n`;
    md += `- **Total Cards:** ${deck.cards.length}\n`;
    if (deck.description) {
      md += `- **Description:** ${deck.description}\n`;
    }
    md += `\n---\n\n`;

    md += `| # | Front (Question/Prompt) | Back (Answer/Key Point) | Tags |\n`;
    md += `|---|---|---|---|\n`;

    deck.cards.forEach((card, idx) => {
      const front = (card.front || "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
      const back = (card.back || "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
      const tags = (card.tags || []).join(", ");
      md += `| ${idx + 1} | ${front} | ${back} | ${tags} |\n`;
    });

    md += `\n\n## Card List View\n\n`;
    deck.cards.forEach((card, idx) => {
      md += `### Card ${idx + 1}\n`;
      md += `**Q:** ${card.front}\n\n`;
      md += `**A:** ${card.back}\n\n`;
      if (card.tags && card.tags.length > 0) {
        md += `*Tags: ${card.tags.join(", ")}*\n\n`;
      }
      md += `---\n\n`;
    });

    downloadFile(`${sanitizeFilename(deck.title)}_flashcards.md`, md, "text/markdown;charset=utf-8;");
  },

  // Export Note to clean downloadable PDF using jsPDF
  exportNoteToPDF: (note: Note, subjectName?: string) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin;

      // Header Bar / Subject Badge
      const subText = (subjectName || "General").toUpperCase();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      const badgeWidth = Math.min(contentWidth, doc.getTextWidth(subText) + 8);
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.roundedRect(margin, cursorY, badgeWidth, 6, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(subText, margin + 4, cursorY + 4.2);

      cursorY += 12;

      // Note Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900

      const titleLines = doc.splitTextToSize(note.title, contentWidth);
      doc.text(titleLines, margin, cursorY);
      cursorY += titleLines.length * 7 + 2;

      // Date & Metadata
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const dateStr = note.updatedDate ? new Date(note.updatedDate).toLocaleDateString() : new Date().toLocaleDateString();
      const tagsStr = note.tags && note.tags.length > 0 ? `  •  Tags: ${note.tags.map((t) => `#${t}`).join(", ")}` : "";
      doc.text(`Last Updated: ${dateStr}${tagsStr}`, margin, cursorY);
      cursorY += 6;

      // Horizontal divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 8;

      // AI Summary Box if available
      if (note.summary) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);

        const summaryLines = doc.splitTextToSize(note.summary, contentWidth - 8);
        const boxHeight = summaryLines.length * 4.8 + 12;

        if (cursorY + boxHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }

        doc.setFillColor(240, 253, 244); // green-50
        doc.setDrawColor(187, 247, 208); // green-200
        doc.roundedRect(margin, cursorY, contentWidth, boxHeight, 3, 3, "FD");

        doc.setTextColor(21, 128, 61); // green-700
        doc.text("AI EXECUTIVE SUMMARY", margin + 4, cursorY + 5.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(summaryLines, margin + 4, cursorY + 11);

        cursorY += boxHeight + 8;
      }

      // Note Content Heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      if (cursorY + 8 > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text("Study Note Content", margin, cursorY);
      cursorY += 6;

      // Content text Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85); // slate-700

      const contentLines = doc.splitTextToSize(note.content, contentWidth);
      const lineHeight = 4.8;

      for (let i = 0; i < contentLines.length; i++) {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(contentLines[i], margin, cursorY);
        cursorY += lineHeight;
      }

      // Footer with page numbering
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`StudyMate PDF Export  •  ${note.title}`, margin, pageHeight - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 8);
      }

      doc.save(`${sanitizeFilename(note.title)}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF file. Downloading Markdown fallback instead.");
      exportService.exportNoteToMarkdown(note, subjectName);
    }
  },

  // Export ALL Notes as a single compiled PDF file
  exportAllNotesToPDF: (notes: Note[], subjects: Subject[], title = "Study Notes Compilation") => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin;

      // Title & Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229);
      doc.text(title, margin, cursorY);
      cursorY += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Exported on ${new Date().toLocaleDateString()}  •  Total Notes: ${notes.length}`, margin, cursorY);
      cursorY += 6;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 10;

      notes.forEach((note, index) => {
        const subjectName = subjects.find((s) => s.id === note.subjectId)?.name || "General";
        const subText = subjectName.toUpperCase();

        if (cursorY + 30 > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }

        // Subject Badge & Note Index
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);

        const badgeWidth = Math.min(contentWidth - 30, doc.getTextWidth(subText) + 8);
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(margin, cursorY, badgeWidth, 5.5, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(subText, margin + 4, cursorY + 3.8);

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Note ${index + 1} of ${notes.length}`, margin + badgeWidth + 6, cursorY + 4);

        cursorY += 9;

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);

        const titleLines = doc.splitTextToSize(note.title, contentWidth);
        doc.text(titleLines, margin, cursorY);
        cursorY += titleLines.length * 5.5 + 2;

        // Tags & Date
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const dateStr = note.updatedDate ? new Date(note.updatedDate).toLocaleDateString() : "N/A";
        const tagsStr = note.tags && note.tags.length > 0 ? `  •  Tags: ${note.tags.map((t) => `#${t}`).join(", ")}` : "";
        doc.text(`Date: ${dateStr}${tagsStr}`, margin, cursorY);
        cursorY += 5;

        // Summary
        if (note.summary) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setFillColor(241, 245, 249);
          const summaryLines = doc.splitTextToSize(`Summary: ${note.summary}`, contentWidth - 6);
          const sumBoxH = summaryLines.length * 4.2 + 5;

          if (cursorY + sumBoxH > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }

          doc.roundedRect(margin, cursorY, contentWidth, sumBoxH, 2, 2, "F");
          doc.setTextColor(30, 41, 59);
          doc.text(summaryLines, margin + 3, cursorY + 4.2);
          cursorY += sumBoxH + 4;
        }

        // Content
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);

        const contentLines = doc.splitTextToSize(note.content, contentWidth);
        const lineHeight = 4.5;

        for (let i = 0; i < contentLines.length; i++) {
          if (cursorY + lineHeight > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text(contentLines[i], margin, cursorY);
          cursorY += lineHeight;
        }

        cursorY += 6;

        if (index < notes.length - 1) {
          if (cursorY + 10 > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          } else {
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += 8;
          }
        }
      });

      // Footer page numbering
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`StudyMate Compilation PDF`, margin, pageHeight - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 8);
      }

      doc.save(`${sanitizeFilename(title)}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF compilation. Downloading Markdown fallback instead.");
      exportService.exportAllNotesToMarkdown(notes, subjects, title);
    }
  },

  // Export Flashcard Deck as Markdown
  exportDeckToPDF: (deck: FlashcardDeck, subjectName?: string) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(`Flashcard Deck: ${deck.title}`, margin, cursorY);
      cursorY += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Subject: ${subjectName || "General"}  •  Total Cards: ${deck.cards.length}`, margin, cursorY);
      cursorY += 8;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 8;

      deck.cards.forEach((card, idx) => {
        const frontLines = doc.splitTextToSize(`Q: ${card.front}`, contentWidth / 2 - 6);
        const backLines = doc.splitTextToSize(`A: ${card.back}`, contentWidth / 2 - 6);
        const maxLines = Math.max(frontLines.length, backLines.length);
        const cardH = maxLines * 4.5 + 10;

        if (cursorY + cardH > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, cursorY, contentWidth, cardH, 2.5, 2.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(99, 102, 241);
        doc.text(`CARD ${idx + 1}`, margin + 3, cursorY + 4.5);

        // Left Column (Front)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(frontLines, margin + 3, cursorY + 9);

        // Right Column (Back)
        doc.setTextColor(16, 185, 129);
        doc.text(backLines, margin + contentWidth / 2 + 3, cursorY + 9);

        cursorY += cardH + 4;
      });

      doc.save(`${sanitizeFilename(deck.title)}_flashcards.pdf`);
    } catch (e) {
      console.error(e);
      exportService.exportDeckToMarkdown(deck, subjectName);
    }
  },
};

