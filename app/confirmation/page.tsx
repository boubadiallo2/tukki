"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Check,
  Copy,
  Printer,
  Share2,
  ArrowRight,
  Compass,
  Calendar,
  ShieldCheck,
  Download,
  Bus,
  Info,
  CheckCircle2
} from "lucide-react";

function ConfirmationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Retrieve params
  const bookingNumber = searchParams.get("bookingNumber") || "SEN-789234";
  const namesStr = searchParams.get("name") || "Amadou Diop";
  const phone = searchParams.get("phone") || "+221 77 123 45 67";
  const email = searchParams.get("email") || "";
  const seatsStr = searchParams.get("seats") || "1";
  const tripId = searchParams.get("tripId") || "";
  const from = searchParams.get("from") || "Dakar";
  const to = searchParams.get("to") || "Saint-Louis";
  const date = searchParams.get("date") || "2026-06-15";
  const departureTime = searchParams.get("departureTime") || "08:30";
  const arrivalTime = searchParams.get("arrivalTime") || "14:45";
  const operator = searchParams.get("operator") || "Tukki Express";
  const totalPrice = searchParams.get("price") || "6000";

  const [copied, setCopied] = useState(false);

  // Copy booking code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const namesList = namesStr.split(",").map(n => n.trim());
  const seatsList = seatsStr.split(",").map(s => s.trim());
  const passengers = namesList.map((name, idx) => ({
    name,
    seat: seatsList[idx] || seatsList[0] || "",
    id: `${bookingNumber}-${idx + 1}`
  }));

  const downloadPDF = async (passengerId: string, pName: string) => {
    const element = document.getElementById(`ticket-${passengerId}`);
    if (!element) {
      toast.error("Impossible de trouver le ticket.");
      return;
    }
    
    const toastId = toast.loading("Génération du PDF en cours...");
    
    try {
      // Use explicit width and height to prevent cropping
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      const dataUrl = await toPng(element, { 
        cacheBust: true, 
        pixelRatio: 2,
        width: width,
        height: height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      
      const margin = 15; // 15mm margin
      const maxPdfWidth = pageWidth - margin * 2;
      const maxPdfHeight = pageHeight - margin * 2;
      
      let finalWidth = maxPdfWidth;
      let finalHeight = (imgProps.height * finalWidth) / imgProps.width;
      
      // Scale down if it exceeds page height
      if (finalHeight > maxPdfHeight) {
        finalHeight = maxPdfHeight;
        finalWidth = (imgProps.width * finalHeight) / imgProps.height;
      }
      
      // Center horizontally
      const x = (pageWidth - finalWidth) / 2;
      const y = margin;
      
      pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`Ticket-TUKKI-${pName.replace(/\s+/g, '-')}.pdf`);
      toast.success("Ticket téléchargé avec succès !", { id: toastId });
    } catch (error: any) {
      console.error("Erreur lors de la génération du PDF", error);
      toast.error(`Erreur: ${error?.message || "Inconnue"}`, { id: toastId });
    }
  };

  // Print ticket
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp share Link
  const shareMessage = `Bonjour ! Je viens de réserver mon trajet sur TUKKI ! 🚌 Billet : ${bookingNumber} de ${from} à ${to} le ${date}. Horaires : ${departureTime} - ${arrivalTime}.`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  // Custom print-specific stylesheet inside the component to keep layout neat during print
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-ticket, #printable-ticket * {
          visibility: visible;
        }
        #printable-ticket {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          border: none;
          box-shadow: none;
        }
        header, footer, .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Format currency helper
  const formatPrice = (pStr: string) => {
    const parsed = parseInt(pStr, 10);
    if (isNaN(parsed)) return pStr;
    return `${parsed.toLocaleString()} FCFA`;
  };

  return (
    <>
      <div className="no-print">
        <Header />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Step progress bar */}
        <div className="max-w-3xl mx-auto mb-10 hidden md:block no-print">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
            <div className="flex items-center text-brand-green">
              <span className="w-6 h-6 rounded-full border-2 border-brand-green flex items-center justify-center mr-2 bg-brand-green text-white text-[10px] font-bold">1</span>
              <span>Choix du trajet</span>
            </div>
            <div className="flex-grow h-0.5 bg-brand-green mx-4"></div>
            <div className="flex items-center text-brand-green">
              <span className="w-6 h-6 rounded-full border-2 border-brand-green flex items-center justify-center mr-2 bg-brand-green text-white text-[10px] font-bold">2</span>
              <span>Passagers & Sièges</span>
            </div>
            <div className="flex-grow h-0.5 bg-brand-green mx-4"></div>
            <div className="flex items-center text-brand-green">
              <span className="w-6 h-6 rounded-full border-2 border-brand-green flex items-center justify-center mr-2 bg-brand-green text-white text-[10px] font-bold">3</span>
              <span>Confirmation</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 flex items-start space-x-4 max-w-2xl mx-auto animate-fade-in no-print">
          <div className="w-10 h-10 rounded-full bg-brand-green text-brand-yellow flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 fill-brand-green" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black text-emerald-950">Réservation Confirmée !</h2>
            <p className="text-sm text-emerald-800 leading-relaxed font-medium">
              Votre ticket a été généré avec succès. Une confirmation SMS a été envoyée sur votre numéro et une copie imprimable de votre billet est disponible ci-dessous.
            </p>
          </div>
        </div>

        {/* Printable Boarding Ticket Cards */}
        <div className="flex flex-col gap-16 max-w-2xl mx-auto mb-10">
          {passengers.map((passenger) => (
            <div key={passenger.id} className="text-center w-full">
              <div
                id={`ticket-${passenger.id}`}
                className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 w-full max-w-md mx-auto shadow-sm text-left relative"
              >
                {/* Logo */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className="text-gray-800">
                    <Bus className="w-8 h-8" />
                  </div>
                  <div className="leading-tight">
                    <span className="text-xl font-black tracking-wider text-gray-900 block uppercase">
                      {operator}
                    </span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Transport</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-6"></div>

                {/* Depart / Destination */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">Ville de départ:</p>
                    <p className="text-[13px] text-gray-600">{from}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">Ville de destination:</p>
                    <p className="text-[13px] text-gray-600">{to}</p>
                  </div>
                </div>

                {/* Date / Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">Date du voyage:</p>
                    <p className="text-[13px] text-gray-600">{new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">Heure de départ:</p>
                    <p className="text-[13px] text-gray-600">{departureTime}</p>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-6"></div>

                {/* Client */}
                <div className="mb-5">
                  <p className="text-[13px] font-bold text-gray-900 mb-1">Client:</p>
                  <p className="text-[13px] text-gray-600">{passenger.name}</p>
                </div>

                {/* Ticket / Price */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">Ticket:</p>
                    <p className="text-[13px] text-gray-600">{passenger.id.replace('SEN-', '')}{Math.floor(Math.random() * 100000000)}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">Prix total:</p>
                    <p className="text-[13px] text-gray-600">{formatPrice(Math.round(parseInt(totalPrice) / passengers.length).toString())}</p>
                  </div>
                </div>

                {/* Seat */}
                <div className="mb-6">
                  <p className="text-[13px] font-bold text-gray-900 mb-2">Siège:</p>
                  <div className="inline-flex items-center justify-center w-10 h-10 border border-gray-100 rounded-xl shadow-xs">
                    <span className="text-sm font-medium text-gray-800">{passenger.seat}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center text-gray-500 space-x-2">
                  <Info className="w-4 h-4 fill-gray-400 text-white shrink-0" />
                  <p className="text-[13px] italic text-gray-500">Embarquement 1h avant le départ</p>
                </div>

                <div className="border-t border-dashed border-gray-200 my-6"></div>

                {/* QR Code */}
                <div className="flex justify-center mt-4">
                  <svg
                    className="w-32 h-32"
                    width="128"
                    height="128"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    shapeRendering="crispEdges"
                  >
                    <rect width="100" height="100" fill="white" />
                    <rect x="5" y="5" width="25" height="25" fill="#111827" />
                    <rect x="10" y="10" width="15" height="15" fill="white" />
                    <rect x="13" y="13" width="9" height="9" fill="#111827" />
                    
                    <rect x="70" y="5" width="25" height="25" fill="#111827" />
                    <rect x="75" y="10" width="15" height="15" fill="white" />
                    <rect x="78" y="13" width="9" height="9" fill="#111827" />
                    
                    <rect x="5" y="70" width="25" height="25" fill="#111827" />
                    <rect x="10" y="75" width="15" height="15" fill="white" />
                    <rect x="13" y="78" width="9" height="9" fill="#111827" />
                    
                    <rect x="35" y="5" width="5" height="5" fill="#1a1a1a" />
                    <rect x="45" y="5" width="10" height="5" fill="#1a1a1a" />
                    <rect x="60" y="5" width="5" height="5" fill="#1a1a1a" />
                    <rect x="35" y="15" width="15" height="5" fill="#1a1a1a" />
                    <rect x="55" y="15" width="5" height="10" fill="#1a1a1a" />
                    <rect x="35" y="25" width="5" height="5" fill="#1a1a1a" />
                    <rect x="45" y="25" width="15" height="5" fill="#1a1a1a" />
                    <rect x="5" y="35" width="10" height="5" fill="#1a1a1a" />
                    <rect x="20" y="35" width="10" height="10" fill="#1a1a1a" />
                    <rect x="35" y="35" width="5" height="5" fill="#1a1a1a" />
                    <rect x="45" y="35" width="20" height="5" fill="#1a1a1a" />
                    <rect x="70" y="35" width="10" height="5" fill="#1a1a1a" />
                    <rect x="85" y="35" width="10" height="10" fill="#1a1a1a" />
                    <rect x="5" y="50" width="15" height="5" fill="#1a1a1a" />
                    <rect x="25" y="50" width="5" height="15" fill="#1a1a1a" />
                    <rect x="35" y="45" width="15" height="5" fill="#1a1a1a" />
                    <rect x="55" y="45" width="10" height="10" fill="#1a1a1a" />
                    <rect x="70" y="50" width="5" height="5" fill="#1a1a1a" />
                    <rect x="80" y="50" width="15" height="5" fill="#1a1a1a" />
                    <rect x="35" y="60" width="10" height="5" fill="#1a1a1a" />
                    <rect x="50" y="60" width="5" height="5" fill="#1a1a1a" />
                    <rect x="60" y="60" width="15" height="5" fill="#1a1a1a" />
                    <rect x="80" y="60" width="5" height="10" fill="#1a1a1a" />
                    <rect x="35" y="70" width="5" height="15" fill="#1a1a1a" />
                    <rect x="45" y="75" width="20" height="5" fill="#1a1a1a" />
                    <rect x="70" y="75" width="5" height="5" fill="#1a1a1a" />
                    <rect x="80" y="75" width="15" height="10" fill="#1a1a1a" />
                    <rect x="35" y="90" width="15" height="5" fill="#1a1a1a" />
                    <rect x="55" y="85" width="5" height="10" fill="#1a1a1a" />
                    <rect x="65" y="90" width="20" height="5" fill="#1a1a1a" />
                  </svg>
                </div>
              </div>
              
              {/* Individual Download Button */}
              <button
                onClick={() => downloadPDF(passenger.id, passenger.name)}
                className="mt-6 inline-flex bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xs hover:shadow-md transition items-center justify-center space-x-2 cursor-pointer no-print"
              >
                <Download className="w-4.5 h-4.5 text-brand-yellow" />
                <span>Télécharger ce ticket (PDF)</span>
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-2xl mx-auto no-print">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xs hover:shadow-md transition flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Printer className="w-4.5 h-4.5 text-brand-yellow" />
            <span>Imprimer le Billet</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xs hover:shadow-md transition flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Share2 className="w-4.5 h-4.5 text-white" />
            <span>Partager sur WhatsApp</span>
          </a>

          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-6 py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <span>Réserver un autre trajet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Header />
        <div className="flex-grow flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-500">Génération du pass d'embarquement en cours...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <ConfirmationPageContent />
    </Suspense>
  );
}
