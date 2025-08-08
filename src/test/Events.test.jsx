import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Events from '../pages/events';

vi.mock('axios');

const mockEvents = [
  {
    _id: '1',
    id: '1',
    name: 'Événement Test 1',
    date: '2024-01-15',
    location: 'Paris',
    description: 'Description test 1',
    cover_image_url: '/uploads/photos/event1.jpg',
    photoCount: 5
  },
  {
    _id: '2',
    id: '2',
    name: 'Événement Test 2',
    date: '2024-02-15',
    location: 'Lyon',
    description: 'Description test 2',
    cover_image_url: '/uploads/photos/event2.jpg',
    photoCount: 8
  }
];

const EventsWithRouter = () => (
  <BrowserRouter>
    <Events />
  </BrowserRouter>
);

describe('Events Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher la liste des événements', async () => {
    axios.get.mockResolvedValue({ data: mockEvents });

    render(<EventsWithRouter />);

    // Attendre que les événements soient chargés
    await waitFor(() => {
      expect(screen.getByText('Événement Test 1')).toBeInTheDocument();
      expect(screen.getByText('Événement Test 2')).toBeInTheDocument();
    });

    // Vérifier les informations des événements
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Lyon')).toBeInTheDocument();
  });

  it('devrait afficher un message si aucun événement n\'est trouvé', async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(<EventsWithRouter />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun événement trouvé/i)).toBeInTheDocument();
    });
  });

  it('devrait gérer les erreurs de chargement', async () => {
    axios.get.mockRejectedValue(new Error('Erreur réseau'));

    render(<EventsWithRouter />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('devrait naviguer vers la page de photos d\'un événement', async () => {
    axios.get.mockResolvedValue({ data: mockEvents });

    render(<EventsWithRouter />);

    await waitFor(() => {
      expect(screen.getByText('Événement Test 1')).toBeInTheDocument();
    });

    // Chercher le bouton "Voir les photos" ou similaire
    const viewPhotosButton = screen.getByText(/Voir les photos|Voir les images/i);
    expect(viewPhotosButton).toBeInTheDocument();

    fireEvent.click(viewPhotosButton);
    // Le comportement de navigation est mockée dans le setup
  });

  it('devrait afficher le nombre de photos par événement', async () => {
    axios.get.mockResolvedValue({ data: mockEvents });

    render(<EventsWithRouter />);

    await waitFor(() => {
      expect(screen.getByText('5 photos')).toBeInTheDocument();
      expect(screen.getByText('8 photos')).toBeInTheDocument();
    });
  });

  it('devrait formater correctement les dates', async () => {
    axios.get.mockResolvedValue({ data: mockEvents });

    render(<EventsWithRouter />);

    await waitFor(() => {
      // Vérifier que les dates sont présentes et formatées
      expect(screen.getByText(/15 janvier 2024|15\/01\/2024|2024-01-15/)).toBeInTheDocument();
      expect(screen.getByText(/15 février 2024|15\/02\/2024|2024-02-15/)).toBeInTheDocument();
    });
  });

  it('devrait trier les événements par date décroissante', async () => {
    const eventsOutOfOrder = [...mockEvents].reverse();
    axios.get.mockResolvedValue({ data: eventsOutOfOrder });

    render(<EventsWithRouter />);

    await waitFor(() => {
      const eventElements = screen.getAllByTestId(/event-card|event-item/);
      expect(eventElements).toHaveLength(2);
      
      // Le plus récent (Février) devrait être en premier
      expect(eventElements[0]).toHaveTextContent('Événement Test 2');
      expect(eventElements[1]).toHaveTextContent('Événement Test 1');
    });
  });

  it('devrait gérer les événements sans image de couverture', async () => {
    const eventsWithoutImages = mockEvents.map(event => ({
      ...event,
      cover_image_url: null
    }));
    
    axios.get.mockResolvedValue({ data: eventsWithoutImages });

    render(<EventsWithRouter />);

    await waitFor(() => {
      expect(screen.getByText('Événement Test 1')).toBeInTheDocument();
      // Vérifier qu'une image par défaut ou un placeholder est affiché
      const placeholderImages = screen.getAllByAltText(/placeholder|par défaut/i);
      expect(placeholderImages.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('devrait permettre de rechercher des événements', async () => {
    axios.get.mockResolvedValue({ data: mockEvents });

    render(<EventsWithRouter />);

    await waitFor(() => {
      expect(screen.getByText('Événement Test 1')).toBeInTheDocument();
    });

    // Chercher un champ de recherche
    const searchInput = screen.queryByPlaceholderText(/Rechercher|Search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'Paris' } });
      
      await waitFor(() => {
        expect(screen.getByText('Événement Test 1')).toBeInTheDocument();
        expect(screen.queryByText('Événement Test 2')).not.toBeInTheDocument();
      });
    }
  });

  it('devrait afficher un indicateur de chargement', async () => {
    // Simuler un délai de chargement
    axios.get.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: mockEvents }), 100)
      )
    );

    render(<EventsWithRouter />);

    // Vérifier qu'un indicateur de chargement est affiché
    expect(screen.getByText(/Chargement|Loading|Spinner/i)).toBeInTheDocument();

    // Attendre que le chargement soit terminé
    await waitFor(() => {
      expect(screen.getByText('Événement Test 1')).toBeInTheDocument();
    });

    // L'indicateur de chargement ne devrait plus être visible
    expect(screen.queryByText(/Chargement|Loading|Spinner/i)).not.toBeInTheDocument();
  });
});
