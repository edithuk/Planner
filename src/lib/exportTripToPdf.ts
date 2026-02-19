import { jsPDF } from 'jspdf';
import type { Trip, PlaceItem } from '../types';

const MARGIN = 15;
const PAGE_HEIGHT = 297;
const BOTTOM_MARGIN = 20;
const MAX_Y = PAGE_HEIGHT - BOTTOM_MARGIN;
const LINE_HEIGHT = 6;
const SECTION_SPACING = 8;
const ITEM_INDENT = 5;

function sanitizeFilename(name: string): string {
  return name.replaceAll(/[/\\?%*:|"<>]/g, '-').trim() || 'Trip';
}

function addTextWithWrap(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number
): number {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * LINE_HEIGHT;
}

function addPlaceItem(
  doc: jsPDF,
  item: PlaceItem,
  index: number,
  x: number,
  y: number,
  maxWidth: number,
  checkPage: (currentY: number) => number
): number {
  let currentY = checkPage(y);
  currentY = addTextWithWrap(
    doc,
    `${index}. ${item.name}`,
    x,
    currentY,
    maxWidth,
    10
  );

  if (item.recommendedFor) {
    currentY = checkPage(currentY);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    currentY = addTextWithWrap(
      doc,
      `   For: ${item.recommendedFor}`,
      x + ITEM_INDENT,
      currentY,
      maxWidth - ITEM_INDENT,
      9
    );
    doc.setTextColor(0, 0, 0);
  }

  if (item.instructions) {
    currentY = checkPage(currentY);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    currentY = addTextWithWrap(
      doc,
      `   ${item.instructions}`,
      x + ITEM_INDENT,
      currentY,
      maxWidth - ITEM_INDENT,
      9
    );
    doc.setTextColor(0, 0, 0);
  }

  return currentY + 2;
}

function addSection(
  doc: jsPDF,
  title: string,
  items: PlaceItem[],
  x: number,
  y: number,
  maxWidth: number,
  checkPage: (currentY: number) => number
): number {
  let currentY = checkPage(y);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x, currentY);
  currentY += LINE_HEIGHT + 2;

  if (items.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('(empty)', x + ITEM_INDENT, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += LINE_HEIGHT + SECTION_SPACING;
    return currentY;
  }

  doc.setFont('helvetica', 'normal');
  items.forEach((item, i) => {
    currentY = addPlaceItem(doc, item, i + 1, x, currentY, maxWidth, checkPage);
  });

  currentY += SECTION_SPACING;
  return currentY;
}

export function exportTripToPdf(trip: Trip): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - MARGIN * 2;

  let y = MARGIN;

  const checkPage = (currentY: number): number => {
    if (currentY > MAX_Y - 20) {
      doc.addPage();
      return MARGIN;
    }
    return currentY;
  };

  // Title
  y = checkPage(y);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(trip.name, maxWidth);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * LINE_HEIGHT + 10;

  // Suggested for Me
  y = addSection(
    doc,
    'Suggested for Me',
    trip.recommendedPlaces,
    MARGIN,
    y,
    maxWidth,
    checkPage
  );

  // Want to Visit
  y = addSection(
    doc,
    'Want to Visit',
    trip.wishlist,
    MARGIN,
    y,
    maxWidth,
    checkPage
  );

  // Confirmed
  y = addSection(
    doc,
    'Confirmed',
    trip.todo,
    MARGIN,
    y,
    maxWidth,
    checkPage
  );

  // Day Plan
  if (trip.days.length > 0) {
    y = checkPage(y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Day Plan', MARGIN, y);
    y += LINE_HEIGHT + 4;

    doc.setFont('helvetica', 'normal');

    trip.days.forEach((day) => {
      y = checkPage(y);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(day.name, MARGIN + ITEM_INDENT, y);
      y += LINE_HEIGHT + 2;

      doc.setFont('helvetica', 'normal');
      if (day.items.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('(empty)', MARGIN + ITEM_INDENT * 2, y);
        doc.setTextColor(0, 0, 0);
        y += LINE_HEIGHT + 4;
      } else {
        day.items.forEach((item, i) => {
          y = addPlaceItem(
            doc,
            item,
            i + 1,
            MARGIN + ITEM_INDENT * 2,
            y,
            maxWidth - ITEM_INDENT * 2,
            checkPage
          );
        });
        y += 4;
      }
    });
  }

  const filename = `Trip-${sanitizeFilename(trip.name)}.pdf`;
  doc.save(filename);
}
