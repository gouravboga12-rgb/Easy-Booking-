import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { HiX } from 'react-icons/hi';
import './PopupAdModal.css';

const isVideo = (url) => {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.endsWith('.mov');
};

export default function PopupAdModal() {
  const navigate = useNavigate();
  const popupAds = useStore(s => s.popupAds) || [];
  const fetchPopupAds = useStore(s => s.fetchPopupAds);

  const [visible, setVisible] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);

  useEffect(() => {
    if (fetchPopupAds) fetchPopupAds();
  }, [fetchPopupAds]);

  useEffect(() => {
    // Check if user has already dismissed pop-up ad in this session
    const hasSeenPopup = sessionStorage.getItem('popup_ad_dismissed');
    if (hasSeenPopup) return;

    // Filter active pop-up ads
    const activeAds = popupAds.filter(ad => ad.active !== 0 && ad.active !== false && ad.mediaUrl);
    if (activeAds.length === 0) return;

    // Select the latest active ad
    const adToDisplay = activeAds[0];
    setCurrentAd(adToDisplay);

    const delayMs = (adToDisplay.delaySeconds || 15) * 1000;

    const timer = setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [popupAds]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('popup_ad_dismissed', 'true');
  };

  const handleMediaClick = () => {
    if (!currentAd) return;

    handleClose();

    if (currentAd.redirectUrl) {
      if (currentAd.redirectUrl.startsWith('http://') || currentAd.redirectUrl.startsWith('https://')) {
        window.open(currentAd.redirectUrl, '_blank');
      } else {
        navigate(currentAd.redirectUrl);
      }
    }
  };

  if (!visible || !currentAd) return null;

  return (
    <div className="popup-ad-overlay" onClick={handleClose}>
      <div className="popup-ad-card" onClick={e => e.stopPropagation()}>
        <button className="popup-ad-close-btn" onClick={handleClose} aria-label="Close Ad">
          <HiX style={{ width: 18, height: 18 }} />
        </button>

        <div className="popup-ad-media-wrapper">
          <span className="popup-ad-badge">Ad</span>
          {isVideo(currentAd.mediaUrl) ? (
            <video
              src={currentAd.mediaUrl}
              className="popup-ad-media"
              autoPlay
              loop
              muted
              playsInline
              onClick={handleMediaClick}
            />
          ) : (
            <img
              src={currentAd.mediaUrl}
              alt={currentAd.title || 'Advertisement'}
              className="popup-ad-media"
              onClick={handleMediaClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
