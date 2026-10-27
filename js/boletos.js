/**
 * Heavy Metal Rock TV - Ticket Box Office Controller
 * Module: Concerts & Events Filter
 */

(() => {
    'use strict';

    const filterButtons = document.querySelectorAll('.event-filter-btn');
    const eventCards = document.querySelectorAll('.event-card');
    const countBadge = document.getElementById('eventsCount');

    if (!filterButtons.length || !eventCards.length) return;

    function applyFilter(category) {
        let visibleCount = 0;

        eventCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category') || 'todos';
            const matches = category === 'todos' || cardCategory.includes(category);

            if (matches) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (countBadge) {
            countBadge.textContent = `(${visibleCount})`;
        }
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-filter') || 'todos';
            applyFilter(cat);
        });
    });

    // Conteo inicial
    if (countBadge) {
        countBadge.textContent = `(${eventCards.length})`;
    }
})();
