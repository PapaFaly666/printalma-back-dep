<!--
  Composant Vue.js - PaytechButton
  Composant réutilisable pour intégrer Paytech dans Vue.js
-->

<template>
  <div class="paytech-button">
    <button
      @click="handlePayment"
      :disabled="loading || disabled"
      :class="buttonClasses"
    >
      <span v-if="loading" class="spinner"></span>
      {{ loading ? 'Traitement...' : buttonText }}
    </button>

    <!-- Message d'erreur -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Modal de confirmation -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <h3>Confirmer le paiement</h3>
        <p>Vous êtes sur le point de payer <strong>{{ amount }} XOF</strong> pour :</p>
        <p class="item-name">{{ itemName }}</p>
        <div class="modal-buttons">
          <button @click="closeConfirmModal" class="btn-cancel">
            Annuler
          </button>
          <button @click="confirmPayment" class="btn-confirm">
            Confirmer le paiement
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

// Service Paytech (à adapter selon votre configuration)
import PaytechService from './paytech-service.js';

export default {
  name: 'PaytechButton',
  props: {
    // Props requises
    itemName: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      validator: value => value > 0
    },
    refCommand: {
      type: String,
      required: true
    },

    // Props optionnelles
    commandName: {
      type: String,
      default: ''
    },
    currency: {
      type: String,
      default: 'XOF',
      validator: value => ['XOF', 'EUR', 'USD', 'CAD', 'GBP', 'MAD'].includes(value)
    },
    env: {
      type: String,
      default: 'test',
      validator: value => ['test', 'prod'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    buttonClass: {
      type: String,
      default: 'btn-primary'
    },
    showConfirmation: {
      type: Boolean,
      default: true
    },

    // URLs de redirection
    successUrl: {
      type: String,
      default: () => `${window.location.origin}/payment/success`
    },
    cancelUrl: {
      type: String,
      default: () => `${window.location.origin}/payment/cancel`
    },

    // Données additionnelles
    customData: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['payment-initiated', 'payment-success', 'payment-error'],

  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);
    const showConfirmModal = ref(false);

    const paytechService = new PaytechService();

    // Classes CSS calculées
    const buttonClasses = computed(() => {
      return [
        'paytech-button-base',
        props.buttonClass,
        {
          'loading': loading.value,
          'disabled': props.disabled
        }
      ].filter(Boolean).join(' ');
    });

    const buttonText = computed(() => {
      return `Payer ${props.amount} XOF`;
    });

    // Gérer le clic sur le bouton
    const handlePayment = async () => {
      if (props.disabled || loading.value) return;

      error.value = null;

      // Afficher la modal de confirmation si nécessaire
      if (props.showConfirmation) {
        showConfirmModal.value = true;
      } else {
        await processPayment();
      }
    };

    // Confirmer le paiement
    const confirmPayment = async () => {
      showConfirmModal.value = false;
      await processPayment();
    };

    // Fermer la modal de confirmation
    const closeConfirmModal = () => {
      showConfirmModal.value = false;
    };

    // Traiter le paiement
    const processPayment = async () => {
      loading.value = true;

      try {
        // Préparer les données de paiement
        const paymentData = {
          item_name: props.itemName,
          item_price: props.amount,
          ref_command: props.refCommand,
          command_name: props.commandName || `Achat de ${props.itemName}`,
          currency: props.currency,
          env: props.env,
          success_url: props.successUrl,
          cancel_url: props.cancelUrl,
          custom_field: JSON.stringify({
            ...props.customData,
            timestamp: new Date().toISOString(),
            source: 'vue-component'
          })
        };

        // Émettre l'événement d'initialisation
        emit('payment-initiated', paymentData);

        // Initialiser le paiement
        const response = await paytechService.initializePayment(paymentData);

        // Rediriger vers Paytech
        window.location.href = response.data.redirect_url;

      } catch (err) {
        const errorMessage = err.message || 'Erreur lors de l\'initialisation du paiement';
        error.value = errorMessage;
        emit('payment-error', errorMessage);
      } finally {
        loading.value = false;
      }
    };

    return {
      loading,
      error,
      showConfirmModal,
      buttonClasses,
      buttonText,
      handlePayment,
      confirmPayment,
      closeConfirmModal
    };
  }
};
</script>

<style scoped>
.paytech-button {
  display: inline-block;
}

.paytech-button-base {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.btn-primary {
  background-color: #10b981;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #059669;
}

.paytech-button-base.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.paytech-button-base.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.modal-content p {
  margin: 8px 0;
  color: #6b7280;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
  margin: 16px 0;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: center;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-confirm {
  background-color: #10b981;
  color: white;
}

.btn-confirm:hover {
  background-color: #059669;
}
</style>