import React, { useEffect, useRef, useState } from 'react';
import { Category } from '../types';
import { Scroll, Globe2, FlaskConical, Dumbbell, Paintbrush2, Popcorn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getGameSettings } from './SettingsModal';

interface WheelOfCategoriesProps {
  onSelectCategory: (category: Category) => void;
}

export const WheelOfCategories: React.FC<WheelOfCategoriesProps> = ({ onSelectCategory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const { t } = useTranslation();
  const categoryImagesRef = useRef<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const drawWheelRef = useRef<(currentAngle?: number) => void>();
  const wheelSoundRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(getGameSettings().soundEnabled);

  // Ses dosyasını yükle
  useEffect(() => {
    wheelSoundRef.current = new Audio('/wheel.mp3');
  }, []);

  // Ayarlar değiştiğinde ses durumunu güncelle
  useEffect(() => {
    const handleStorageChange = () => {
      setSoundEnabled(getGameSettings().soundEnabled);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const categories = [
    { name: Category.HISTORY, color: '#eab308', icon: Scroll, image: '/history.png' },     // bg-yellow-500
    { name: Category.GEOGRAPHY, color: '#3b82f6', icon: Globe2, image: '/geography.png' },   // bg-blue-500
    { name: Category.SCIENCE, color: '#22c55e', icon: FlaskConical, image: '/science.png' },   // bg-green-500
    { name: Category.SPORTS, color: '#f97316', icon: Dumbbell, image: '/sport.png' },       // bg-orange-500
    { name: Category.ART, color: '#ef4444', icon: Paintbrush2, image: '/art.png' },             // bg-red-500
    { name: Category.ENTERTAINMENT, color: '#ec4899', icon: Popcorn, image: '/entertainment.png' }, // bg-pink-500
  ];

  // Görselleri önceden yükle
  useEffect(() => {
    let loadedCount = 0;
    categories.forEach(category => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
      };
      img.src = category.image;
      categoryImagesRef.current[category.name] = img;
    });
  }, []);

  // İlk render ve resimler yüklendiğinde çarkı çizme
  useEffect(() => {
    if (imagesLoaded === categories.length && drawWheelRef.current) {
      drawWheelRef.current();
    }
  }, [imagesLoaded, categories.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = '500px';
    canvas.style.height = '500px';
    canvas.width = 500 * dpr;
    canvas.height = 500 * dpr;

    let angle = 0;

    const drawWheel = (currentAngle: number = 0) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(250, 250);

      for (let i = 0; i < categories.length; i++) {
        const startAngle = currentAngle + (i * 2 * Math.PI / categories.length);
        const endAngle = currentAngle + ((i + 1) * 2 * Math.PI / categories.length);
        const category = categories[i];

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 230, startAngle, endAngle);
        ctx.fillStyle = category.color;
        ctx.fill();
        ctx.closePath();

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 230, startAngle, endAngle);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 230);
        gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(0, 0, 220, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        const imageRadius = 180;
        const centerAngle = startAngle + (Math.PI / categories.length);
        const x = imageRadius * Math.cos(centerAngle);
        const y = imageRadius * Math.sin(centerAngle);
        
        const imageSize = 100;
        const img = categoryImagesRef.current[category.name];
        if (img && img.complete) {
          ctx.translate(x, y);
          ctx.rotate(centerAngle + Math.PI/2);
          ctx.drawImage(img, -imageSize/2, -imageSize/2, imageSize, imageSize);
        }
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(0, 0, 55, 0, 2 * Math.PI);
      ctx.fillStyle = '#121928';
      ctx.fill();
      ctx.restore();
    };

    drawWheelRef.current = drawWheel;

    drawWheel();

    const handleClick = () => {
      if (isSpinning) return;
      setIsSpinning(true);

      // Ses dosyasını çal
      if (wheelSoundRef.current && soundEnabled) {
        wheelSoundRef.current.currentTime = 0; // Sesi baştan başlat
        wheelSoundRef.current.play()
          .catch(err => console.error("Ses çalınamadı:", err));
        
        // Çarkın dönüş süresine göre sesi ayarla
        setTimeout(() => {
          if (wheelSoundRef.current) {
            wheelSoundRef.current.pause();
          }
        }, 5000); // 5 saniye sonra sesi durdur
      }

      const spinTime = 5000; // 5-7 seconds
      const spinAngle = Math.random() * 10 + 30; // 15-25 radians
      let startTime: number | null = null;

      function animate(timestamp: number) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / spinTime;

        if (progress < 1) {
          const easedProgress = 1 - Math.pow(1 - progress, 4);
          angle += spinAngle * (1 - easedProgress) * 0.02;
          drawWheel(angle);
          requestAnimationFrame(animate);
        } else {
          const finalAngle = (angle + Math.PI / 2) % (2 * Math.PI);
          const section = Math.floor((finalAngle / (2 * Math.PI)) * categories.length) % categories.length;
          drawWheel(angle);
          setTimeout(() => {
            setIsSpinning(false);
            onSelectCategory(categories[categories.length - 1 - section].name);
            
            // Ses dosyasını durdur
            if (wheelSoundRef.current && soundEnabled) {
              wheelSoundRef.current.pause();
            }
          }, 500);
        }
      }

      requestAnimationFrame(animate);
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [categories, isSpinning, onSelectCategory, imagesLoaded, soundEnabled]);

  return (
    <div className="relative flex items-center justify-center w-full h-full p-8">
      <div className="relative w-[500px] h-[500px]">
        {/* Pointer */}
        <div className="absolute -top-[0] left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-[#ffff]" />
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="rounded-full shadow-lg cursor-pointer"
          style={{ touchAction: 'none' }}
        />

        {/* Center Logo */}
        <img 
          src="/logo.png" 
          alt="Trivia Night" 
          className="absolute pointer-events-none cursor-pointer top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40  z-20" 
        />
      </div>
    </div>
  );
};
