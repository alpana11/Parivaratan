import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner } from '../types';

const UserWasteRequestPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [formData, setFormData] = useState({
    image: '',
    type: '',
    quantity: '',
    location: '',
    confidence: 95
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const allPartners = await dbService.getAllPartners();
      const approvedPartners = allPartners.filter(p => p.verificationStatus === 'approved');
      setPartners(approvedPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      alert('Please select a recycling partner');
      return;
    }

    setSubmitting(true);
    try {
      const selectedPartner = partners.find(p => p.id === selectedPartnerId);
      const wasteRequest = {
        userId: 'user-123', // Replace with actual user ID from auth
        partnerId: selectedPartnerId,
        image: formData.image || 'https://via.placeholder.com/300x200?text=Waste+Image',
        type: formData.type,
        confidence: formData.confidence,
        quantity: formData.quantity,
        location: formData.location,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        date: new Date().toISOString()
      };

      console.log('📤 CREATING WASTE REQUEST:', {
        wasteType: wasteRequest.type,
        quantity: wasteRequest.quantity,
        location: wasteRequest.location,
        assignedPartner: selectedPartner?.name,
        partnerUID: wasteRequest.partnerId,
        status: wasteRequest.status
      });

      const requestId = await dbService.createWasteRequest(wasteRequest);
      console.log('✅ REQUEST CREATED WITH ID:', requestId, 'ASSIGNED TO PARTNER:', selectedPartnerId);
      
      // Award points to user for submitting waste request
      const pointsEarned = 10; // Base points for submitting request
      const userId = 'user-123'; // Replace with actual user ID from auth
      
      try {
        const user = await dbService.getUser(userId);
        if (user) {
          const newPoints = (user.rewardPoints || 0) + pointsEarned;
          await dbService.updateUserRewardPoints(userId, newPoints);
          
          // Create reward transaction
          await dbService.addRewardTransaction({
            userId,
            type: 'earned',
            points: pointsEarned,
            description: `Submitted ${wasteRequest.type} waste request`,
            date: new Date().toISOString(),
            wasteRequestId: requestId
          });
          
          console.log('✅ USER EARNED', pointsEarned, 'POINTS');
        }
      } catch (error) {
        console.error('Error awarding points:', error);
      }
      
      await dbService.createNotification({
        type: 'waste_request',
        message: `New waste request: ${wasteRequest.type} (${wasteRequest.quantity}) at ${wasteRequest.location}`,
        partnerId: selectedPartnerId,
        status: 'pending'
      });
      
      alert(`Waste request submitted successfully! You earned ${pointsEarned} points!`);
      
      // Reset form
      setFormData({
        image: '',
        type: '',
        quantity: '',
        location: '',
        confidence: 95
      });
      setSelectedPartnerId('');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Submit Waste Request</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Partner Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Recycling Partner *
              </label>
              {loading ? (
                <div className="text-gray-500">Loading partners...</div>
              ) : (
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Choose a partner</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name} - {partner.organization} ({partner.partnerType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Waste Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Waste Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select waste type</option>
                <option value="Plastic Bottles">Plastic Bottles</option>
                <option value="Paper Waste">Paper Waste</option>
                <option value="Metal Cans">Metal Cans</option>
                <option value="Glass Bottles">Glass Bottles</option>
                <option value="E-waste">E-waste</option>
                <option value="Cloth/Textile">Cloth/Textile</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                placeholder="e.g., 5 kg, 10 bottles"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Pickup Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Enter your address"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Image URL (Optional) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="https://example.com/waste-image.jpg"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Waste Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserWasteRequestPage;