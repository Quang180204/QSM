import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Minus, X, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRide } from "../../state/RideProvider";
import { isActiveTrip } from "../../state/rideMachine";
import type { Place, Vehicle } from "../../data/catalog";
import { vehicles } from "../../data/catalog";
import { mapsService } from "../../services/maps";
import { fareService } from "../../services/fare";
import { rideService } from "../../services/ride";
import Mascot from "../Mascot";
import {
  BookingConfirmationCard,
  BookingSuccessCard,
  ErrorCard,
  LocationCandidatesCard,
  LocationConfirmationCard,
  RouteSummaryCard,
  TripStatusCard,
  VehicleComparisonCard,
} from "./SmartCards";
interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}
export default function ChatAssistant() {
  const { ride, dispatch, chatOpen, setChatOpen, chatDraft, setChatDraft } =
    useRide();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [candidates, setCandidates] = useState<Place[]>([]);
  const [options, setOptions] = useState<Vehicle[]>(vehicles);
  const [error, setError] = useState("");
  const [lastRequest, setLastRequest] = useState("");
  const [edit, setEdit] = useState(false);
  const [pickup, setPickup] = useState(ride.route.pickup.name);
  const [destination, setDestination] = useState(ride.route.destination.name);
  const end = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const nav = useNavigate();
  const add = (role: "user" | "ai", text: string) =>
    setMessages((p) => [...p, { id: Date.now() + Math.random(), role, text }]);
  useEffect(() => {
    if (chatOpen) {
      opener.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      opener.current?.focus();
    }
  }, [chatOpen]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, ride.status, pending, candidates]);
  async function send(text = input) {
    if (!text.trim() || pending) return;
    setInput("");
    setError("");
    setLastRequest(text);
    add("user", text);
    if (isActiveTrip(ride.status)) {
      add(
        "ai",
        /hủy/i.test(text)
          ? ride.status === "TRIP_STARTED"
            ? "Chuyến đã bắt đầu. Bạn có thể liên hệ Hỗ trợ để được hướng dẫn."
            : "Bạn có thể hủy tại màn Chuyến đi. Mình sẽ luôn yêu cầu xác nhận trước khi hủy."
          : ride.status === "TRIP_STARTED"
            ? "Bạn còn khoảng 18 phút và 7,2 km đến điểm đến. Đây là thông tin chuyến mô phỏng."
            : "Mình đang theo dõi hành trình của tài xế. Bạn mở Chuyến đi để xem vị trí và thời gian đón nhé.",
      );
      return;
    }
    setPending(true);
    const preferredVehicle = ride.vehicle;
    dispatch({ type: "RESET" });
    dispatch({ type: "SELECT_VEHICLE", vehicle: preferredVehicle });
    dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
    dispatch({ type: "TRANSITION", status: "RESOLVING_LOCATION" });
    try {
      const result = await mapsService.resolve(text);
      if (result.candidates) {
        setCandidates(result.candidates);
        add(
          "ai",
          "Mình tìm thấy hai địa điểm Highlands Bà Triệu. Bạn muốn đến địa chỉ nào?",
        );
      } else if (result.route) {
        setCandidates([]);
        dispatch({ type: "SET_ROUTE", route: result.route });
        add(
          "ai",
          "Mình đã tìm được tuyến đường. Bạn kiểm tra điểm đón và điểm đến nhé.",
        );
      } else {
        dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
        setEdit(true);
        add(
          "ai",
          "Bạn cho mình biết điểm đón và điểm đến để tính tuyến đường nhé.",
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Kết nối gặp sự cố.";
      setError(message);
      dispatch({ type: "ERROR", message });
    } finally {
      setPending(false);
    }
  }
  async function confirmLocations() {
    dispatch({ type: "TRANSITION", status: "LOCATION_CONFIRMED" });
    setPending(true);
    try {
      setOptions(await fareService.quote());
      dispatch({ type: "TRANSITION", status: "QUOTED" });
      add("ai", "Tuyến đường đã sẵn sàng. Bạn chọn phương tiện phù hợp nhé.");
    } catch {
      setError("Chưa thể lấy giá. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }
  async function book() {
    if (pending) return;
    setPending(true);
    try {
      const result = await rideService.book(ride, true);
      dispatch({ type: "BOOKED", id: result.id });
      add(
        "ai",
        "Yêu cầu đặt xe đã được xác nhận. Mình đang tìm tài xế cho bạn.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa thể đặt xe.");
    } finally {
      setPending(false);
    }
  }
  function saveEdit() {
    if (!pickup.trim() || !destination.trim()) return;
    dispatch({ type: "RESET" });
    dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
    dispatch({ type: "TRANSITION", status: "RESOLVING_LOCATION" });
    dispatch({
      type: "SET_ROUTE",
      route: {
        ...ride.route,
        pickup: {
          name: pickup,
          address: /vinuni/i.test(pickup)
            ? "Vinhomes Ocean Park, Hà Nội"
            : "Địa chỉ cần bạn kiểm tra",
        },
        destination: {
          name: destination,
          address: /times/i.test(destination)
            ? "458 Minh Khai, Hà Nội"
            : "Địa chỉ cần bạn kiểm tra",
        },
      },
    });
    setEdit(false);
    setCandidates([]);
  }
  useEffect(() => {
    if (chatOpen && chatDraft) {
      setInput(chatDraft);
      setChatDraft("");
    }
  }, [chatOpen, chatDraft, setChatDraft]);
  const intro = messages.length === 0 && ride.status === "IDLE";
  return (
    <>
      <AnimatePresence>
        {!chatOpen ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            className="assistant-fab"
            aria-label="Mở Trợ lý AI GSM"
            onClick={() => setChatOpen(true)}
          >
            <Mascot />
            <span className="fab-status" />
          </motion.button>
        ) : null}
      </AnimatePresence>
      <dialog
        ref={dialog}
        className="chat-dialog"
        onCancel={() => setChatOpen(false)}
        aria-label="Trợ lý AI GSM"
      >
        <div className="chat-shell">
          <header className="chat-header">
            <Mascot headOnly size={36} />
            <div>
              <strong>Trợ lý AI GSM</strong>
              <small>
                <i />
                Sẵn sàng hỗ trợ
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Thu nhỏ"
              onClick={() => setChatOpen(false)}
            >
              <Minus size={20} />
            </button>
            <button
              className="icon-button"
              aria-label="Đóng trợ lý"
              onClick={() => setChatOpen(false)}
            >
              <X size={20} />
            </button>
          </header>
          <div className="chat-scroll" aria-live="polite">
            <AnimatePresence>
              {intro ? (
                <motion.section
                  className="chat-intro"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: -60 }}
                >
                  <Mascot full />
                  <h2>
                    Xin chào!
                    <br />
                    Mình là AI GSM.
                  </h2>
                  <p>
                    Bạn muốn đi đâu hôm nay?
                    <br />
                    Cứ nói với mình, phần còn lại để mình lo.
                  </p>
                  <div className="suggestions">
                    {[
                      "Đặt xe từ VinUni đến Times City",
                      "Đến Highlands Bà Triệu",
                      "Đi sân bay Nội Bài",
                    ].map((t) => (
                      <button key={t} onClick={() => send(t)}>
                        <MapPin size={16} />
                        {t}
                        <ArrowUp size={15} />
                      </button>
                    ))}
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={"message " + m.role}
              >
                {m.role === "ai" ? <Mascot headOnly size={32} /> : null}
                <div>{m.text}</div>
              </motion.div>
            ))}
            {pending ? (
              <div className="typing" role="status" aria-label="AI đang xử lý">
                <i />
                <i />
                <i />
                <span>Đang xử lý yêu cầu…</span>
              </div>
            ) : null}
            {edit ? (
              <form
                className="smart-card edit-location"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <h3>Chỉnh sửa địa điểm</h3>
                <label>
                  Điểm đón
                  <input
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Điểm đến
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </label>
                <button className="button primary wide">Lưu địa điểm</button>
              </form>
            ) : null}
            {!pending && !edit && candidates.length ? (
              <LocationCandidatesCard
                candidates={candidates}
                onSelect={(p) => {
                  dispatch({
                    type: "SET_ROUTE",
                    route: { ...ride.route, destination: p },
                  });
                  setCandidates([]);
                  add(
                    "ai",
                    "Bạn kiểm tra lại điểm đón và địa điểm vừa chọn nhé.",
                  );
                }}
              />
            ) : null}
            {!pending &&
            !edit &&
            !candidates.length &&
            ride.status === "RESOLVING_LOCATION" ? (
              <LocationConfirmationCard
                route={ride.route}
                onConfirm={confirmLocations}
                onEdit={() => {
                  setPickup(ride.route.pickup.name);
                  setDestination(ride.route.destination.name);
                  setEdit(true);
                }}
              />
            ) : null}
            {["QUOTED", "AWAITING_CONFIRMATION"].includes(ride.status) &&
            !edit ? (
              <>
                <RouteSummaryCard route={ride.route} />
                <VehicleComparisonCard
                  options={options}
                  selected={ride.vehicle}
                  onSelect={(vehicle) =>
                    dispatch({ type: "SELECT_VEHICLE", vehicle })
                  }
                />
              </>
            ) : null}
            {ride.status === "AWAITING_CONFIRMATION" && !edit ? (
              <BookingConfirmationCard
                ride={ride}
                onConfirm={book}
                pending={pending}
                onPayment={(payment) => dispatch({ type: "PAYMENT", payment })}
                onEdit={() => {
                  dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
                  setEdit(true);
                }}
                onCancel={() => {
                  dispatch({ type: "RESET" });
                  add(
                    "ai",
                    "Yêu cầu đã được hủy. Bạn có thể bắt đầu hành trình mới bất cứ lúc nào.",
                  );
                }}
              />
            ) : null}
            {isActiveTrip(ride.status) ? (
              <>
                <BookingSuccessCard
                  onTrack={() => {
                    setChatOpen(false);
                    nav("/chuyen-di");
                  }}
                />
                <TripStatusCard ride={ride} />
              </>
            ) : null}
            {error ? (
              <ErrorCard
                message={error}
                onRetry={() => {
                  setError("");
                  if (ride.status === "AWAITING_CONFIRMATION") void book();
                  else void send(lastRequest);
                }}
              />
            ) : null}
            <div ref={end} />
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="chat-request">
              Yêu cầu của bạn
            </label>
            <input
              id="chat-request"
              placeholder="Nhập nơi bạn muốn đến hoặc yêu cầu của bạn…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={pending}
            />
            <button
              className="send-button"
              aria-label="Gửi yêu cầu"
              disabled={!input.trim() || pending}
            >
              <ArrowUp size={21} />
            </button>
          </form>
          <small className="chat-footnote">
            Bạn luôn xác nhận trước khi đặt xe.
          </small>
        </div>
      </dialog>
    </>
  );
}
